@extends('layouts.main')

@section('title', 'K.I.B F — Konstruksi')


@section('content')
    <link rel="stylesheet"
        href="{{ asset('css/pages/kib/konstruksi.css') }}?v={{ file_exists(public_path('css/pages/kib/konstruksi.css')) ? filemtime(public_path('css/pages/kib/konstruksi.css')) : '1' }}">
    @php
        $rupiah = fn($value) => 'Rp ' . number_format((float) ($value ?? 0), 0, ',', '.');
        $kategoriNama = fn($value) => match (strtoupper(trim((string) $value))) {
            'IPA' => 'Instalasi Pengolahan Air (IPA)',
            'BOOSTER' => 'Booster',
            'PERPIPAAN' => 'Perpipaan',
            default => 'Belum Dikategorikan',
        };
    @endphp
    <section class="kf-page" id="kfApp" data-base="{{ url('/kib/konstruksi') }}" data-token="{{ csrf_token() }}">
        {{-- =========================================================
         HERO — GAYA SAMA DENGAN HALAMAN K.I.B LAINNYA
         ========================================================= --}}
        <header class="kf-hero">
            <div class="kf-hero-shade" aria-hidden="true"></div>

            <div class="kf-hero-content">
                <nav class="kf-breadcrumb" aria-label="Breadcrumb">
                    <a href="{{ route('dashboard') }}" aria-label="Dashboard">
                        <i data-lucide="house"></i>
                    </a>
                    <i data-lucide="chevron-right"></i>
                    <span>K.I.B</span>
                    <i data-lucide="chevron-right"></i>
                    <strong>Konstruksi</strong>
                </nav>

                <div class="kf-date-card" aria-label="Tanggal dan waktu WITA">
                    <span class="kf-date-icon"><i data-lucide="calendar-days"></i></span>
                    <div>
                        <strong
                            id="kfTanggal">{{ now('Asia/Makassar')->locale('id')->translatedFormat('l, d F Y') }}</strong>
                        <small><span id="kfJam">{{ now('Asia/Makassar')->format('H:i:s') }}</span> WITA</small>
                    </div>
                </div>

                <h1>Konstruksi</h1>
                <p class="kf-hero-description">
                    Pengelolaan K.I.B F berdasarkan kategori, cakupan, lokasi, dan dokumen
                    konstruksi Perumda Tirta Kencana Kota Samarinda.
                </p>

                <div class="kf-stats">
                    <article>
                        <span class="kf-stat-icon"><i data-lucide="hard-hat"></i></span>
                        <div>
                            <small>Total Inventaris</small>
                            <strong>{{ number_format($total, 0, ',', '.') }}</strong>
                            <span>Data konstruksi manual</span>
                        </div>
                    </article>
                    <article>
                        <span class="kf-stat-icon"><i data-lucide="map-pin"></i></span>
                        <div>
                            <small>Jumlah Lokasi</small>
                            <strong>{{ number_format((int) $jumlahLokasi, 0, ',', '.') }}</strong>
                            <span>Lokasi terinventarisasi</span>
                        </div>
                    </article>
                    <article>
                        <span class="kf-stat-icon"><i data-lucide="wallet"></i></span>
                        <div>
                            <small>Nilai Konstruksi</small>
                            <strong>{{ $rupiah($nilai) }}</strong>
                            <span>Nilai pencatatan manual</span>
                        </div>
                    </article>
                </div>
            </div>
        </header>

        <section class="kf-panel">
            <div class="kf-section-head">
                <div>
                    <h2>{{ $view === 'arsip' ? 'Arsip Konstruksi Lama' : 'Daftar Konstruksi' }}</h2>
                    <p>{{ $view === 'arsip' ? 'Data historis konstruksi yang hanya dapat dilihat.' : 'Lihat dan kelola data konstruksi berdasarkan kategori, cakupan, dan lokasi.' }}
                    </p>
                </div>
                <div class="kf-panel-actions">
                    <span class="kf-chip">{{ number_format($items->total(), 0, ',', '.') }} hasil</span>
                    <button type="button" class="kf-btn kf-primary" id="kfTambah">
                        <i data-lucide="plus"></i> Tambah Konstruksi
                    </button>
                </div>
            </div>

            <nav class="kf-tabs" aria-label="Jenis data Konstruksi">
                <a href="{{ route('kib.konstruksi') }}" class="{{ $view === 'manual' ? 'active' : '' }}">
                    <i data-lucide="clipboard-list"></i> Data Manual Baru ({{ number_format($total, 0, ',', '.') }})
                </a>
                <a href="{{ route('kib.konstruksi', ['view' => 'arsip']) }}"
                    class="{{ $view === 'arsip' ? 'active' : '' }}">
                    <i data-lucide="archive"></i> Arsip Data Lama ({{ number_format($archiveCount, 0, ',', '.') }})
                </a>
            </nav>

            <form method="GET" action="{{ route('kib.konstruksi') }}" class="kf-toolbar">
                <input type="hidden" name="view" value="{{ $view }}">
                <label class="kf-search">
                    <i data-lucide="search"></i>
                    <input name="q" type="search" value="{{ $search }}"
                        placeholder="Cari pekerjaan, lokasi, uraian...">
                </label>
                @if ($view === 'manual')
                    <label class="kf-filter">
                        <input name="kategori" list="kfKategoriFilterList" value="{{ $category }}"
                            placeholder="Semua kategori" autocomplete="off">
                        <datalist id="kfKategoriFilterList">
                            <option value="IPA">Instalasi Pengolahan Air</option>
                            <option value="BOOSTER">Booster</option>
                            <option value="PERPIPAAN">Perpipaan</option>
                        </datalist>
                    </label>
                @endif
                <button class="kf-btn kf-primary" type="submit"><i data-lucide="filter"></i> Filter</button>
                <a class="kf-btn kf-outline"
                    href="{{ route('kib.konstruksi', $view === 'arsip' ? ['view' => 'arsip'] : []) }}">Reset</a>
            </form>

            @if ($view === 'manual')
                <div class="kf-table-wrap">
                    <table class="kf-table">
                        <thead>
                            <tr class="kf-table-group">
                                <th rowspan="2">No.</th>
                                <th rowspan="2" class="kf-name-col">Nama Barang / Jenis Barang dan Uraian</th>
                                <th rowspan="2">Kategori</th>
                                <th rowspan="2">Cakupan</th>
                                <th rowspan="2">Tahun</th>
                                <th rowspan="2">Bangunan (P, SP, D)</th>
                                <th colspan="2">Konstruksi Bangunan</th>
                                <th rowspan="2">Letak / Lokasi Alamat</th>
                                <th rowspan="2">Status Tanah</th>
                                <th rowspan="2">Asal Usul Pembiayaan</th>
                                <th rowspan="2">Status Aset</th>
                                <th rowspan="2">Nilai (Rp)</th>
                                <th rowspan="2">Dokumen Pendukung</th>
                                <th rowspan="2">Aksi</th>
                            </tr>
                            <tr>
                                <th>Bertingkat / Tidak</th>
                                <th>Beton / Tidak</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($items as $item)
                                <tr>
                                    <td>{{ $items->firstItem() + $loop->index }}</td>
                                    <td class="kf-main-name">
                                        <strong>{{ $item->nama_barang }}</strong>
                                        <small>{{ $item->nama_lokasi }}</small>
                                        <div class="kf-uraian">{{ $item->urai ?: '—' }}</div>
                                    </td>
                                    <td><span class="kf-badge">{{ $kategoriNama($item->kategori) }}</span></td>
                                    <td>{{ $item->cakupan ?: '—' }}</td>
                                    <td>{{ $item->tahun }}</td>
                                    <td>{{ match ((string) $item->type) {'P' => 'Permanen','SP' => 'Semi Permanen','D' => 'Darurat',default => '—'} }}
                                    </td>
                                    <td>{{ $item->struktur ?: '—' }}</td>
                                    <td>{{ $item->materi ?: '—' }}</td>
                                    <td>{{ $item->letak ?: ($item->alamat_lokasi ?: $item->nama_lokasi) }}</td>
                                    <td>{{ $item->status_tanah ?: '—' }}</td>
                                    <td>{{ $item->asal ?: '—' }}</td>
                                    <td>{{ $item->status_aset ?: '—' }}</td>
                                    <td class="kf-money">{{ $rupiah($item->nilai) }}</td>
                                    <td class="kf-uraian">{{ $item->ket ?: 'Buka detail untuk lampiran' }}</td>
                                    <td>
                                        <button type="button" class="kf-btn kf-outline kf-small"
                                            data-kf-detail="{{ $item->id }}">
                                            <i data-lucide="eye"></i> Detail
                                        </button>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="15" class="kf-empty">Belum ada data Konstruksi manual. Klik Tambah
                                        Konstruksi untuk membuat catatan pertama.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            @else
                <div class="kf-archive-notice">
                    <i data-lucide="lock-keyhole"></i>
                    Ini adalah arsip dari tabel lama <code>kib_f_s</code>. Tidak ada operasi tambah, edit, atau hapus pada
                    data ini.
                </div>
                <div class="kf-table-wrap">
                    <table class="kf-table kf-archive-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Nama Konstruksi</th>
                                <th>Tahun</th>
                                <th>Lokasi</th>
                                <th>Bangunan</th>
                                <th>Nilai (Rp)</th>
                                <th>Uraian Pekerjaan</th>
                                <th>Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($items as $item)
                                <tr>
                                    <td>{{ $items->firstItem() + $loop->index }}</td>
                                    <td class="kf-main-name"><strong>{{ $item->nama_barang ?: '—' }}</strong></td>
                                    <td>{{ $item->tahun ?: '—' }}</td>
                                    <td>{{ $item->nama_lokasi ?: '—' }}<small>{{ $item->alamat_lokasi ?: '' }}</small>
                                    </td>
                                    <td>{{ $item->type ?: '—' }}</td>
                                    <td class="kf-money">{{ $rupiah($item->nilai) }}</td>
                                    <td class="kf-uraian">{{ $item->urai ?: '—' }}</td>
                                    <td class="kf-uraian">{{ $item->ket ?: '—' }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="8" class="kf-empty">Belum ada data arsip yang cocok.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            @endif
            <div class="kf-pagination">{{ $items->links() }}</div>
        </section>

        <dialog id="kfModalForm" class="kf-dialog" aria-labelledby="kfFormTitle">
            <form id="kfForm" enctype="multipart/form-data" novalidate>
                @csrf
                <header class="kf-dialog-head">
                    <div><small>FORM PENCATATAN MANUAL</small>
                        <h2 id="kfFormTitle">Tambah Data Konstruksi</h2>
                        <p>Isi informasi sesuai dokumen pekerjaan. Tidak diperlukan voucher Nilai Aset.</p>
                    </div><button type="button" class="kf-x" data-kf-close="kfModalForm" aria-label="Tutup"><i
                            data-lucide="x"></i></button>
                </header>
                <div class="kf-dialog-body">
                    <div id="kfError" class="kf-error" role="alert" hidden></div>

                    <fieldset class="kf-fieldset">
                        <legend><span>1</span> Identitas dan Cakupan</legend>
                        <div class="kf-fields">
                            <label class="kf-full">Nama Barang / Jenis Pekerjaan <em>*</em><input
                                    name="nama_barang_manual" id="kfNama" maxlength="500" required
                                    placeholder="Contoh: Pengadaan dan Pemasangan Pipa Interkoneksi"></label>
                            <label>Kategori <em>*</em><input name="kategori" id="kfKategori" list="kfKategoriList"
                                    required placeholder="Ketik IPA, Booster, atau Perpipaan" autocomplete="off"><datalist
                                    id="kfKategoriList">
                                    <option value="IPA">Instalasi Pengolahan Air (IPA)</option>
                                    <option value="BOOSTER">Booster</option>
                                    <option value="PERPIPAAN">Perpipaan</option>
                                </datalist><small>Gunakan salah satu dari 3 kategori.</small></label>
                            <label>Cakupan <em>*</em><input name="cakupan" id="kfCakupan" list="kfCakupanList"
                                    maxlength="500" required placeholder="Contoh: Wilayah I / Sungai Kapih"><datalist
                                    id="kfCakupanList">
                                    @foreach ($suggestions['cakupan'] as $text)
                                        <option value="{{ $text }}"></option>
                                    @endforeach
                                </datalist>
                            </label>
                            <label>Lokasi / Unit Kerja <em>*</em><input name="lokasi_manual" id="kfLokasi"
                                    list="kfLokasiList" maxlength="500" required
                                    placeholder="Contoh: IPA Sungai Kapih"><datalist id="kfLokasiList">
                                    @foreach ($suggestions['lokasi'] as $text)
                                        <option value="{{ $text }}"></option>
                                    @endforeach
                                </datalist>
                            </label>
                            <label>Alamat Lokasi<input name="alamat_manual" id="kfAlamat" maxlength="500"
                                    placeholder="Alamat lengkap pekerjaan"></label>
                            <label>Departemen<input name="departemen_manual" id="kfDepartemen" list="kfDepList"
                                    maxlength="255" placeholder="Contoh: Produksi"><datalist id="kfDepList">
                                    @foreach ($suggestions['departemen'] as $text)
                                        <option value="{{ $text }}"></option>
                                    @endforeach
                                </datalist>
                            </label>
                            <label>Divisi<input name="divisi_manual" id="kfDivisi" list="kfDivList" maxlength="255"
                                    placeholder="Contoh: IPA Sungai Kapih"><datalist id="kfDivList">
                                    @foreach ($suggestions['divisi'] as $text)
                                        <option value="{{ $text }}"></option>
                                    @endforeach
                                </datalist></label>
                        </div>
                    </fieldset>

                    <fieldset class="kf-fieldset">
                        <legend><span>2</span> Spesifikasi Konstruksi</legend>
                        <div class="kf-fields">
                            <label>Tahun Pekerjaan <em>*</em><input type="number" name="tahun" id="kfTahun"
                                    min="1900" max="2100" required placeholder="2026"></label>
                            <label>Bangunan (P, SP, D)<input name="type" id="kfType" list="kfTypeList"
                                    placeholder="Ketik P, SP, atau D"><datalist id="kfTypeList">
                                    <option value="P">Permanen</option>
                                    <option value="SP">Semi Permanen</option>
                                    <option value="D">Darurat</option>
                                </datalist></label>
                            <label>Bertingkat / Tidak<input name="struktur" id="kfStruktur" list="kfStrukturList"
                                    placeholder="Cari pilihan"><datalist id="kfStrukturList">
                                    <option value="BERTINGKAT"></option>
                                    <option value="TIDAK BERTINGKAT"></option>
                                </datalist></label>
                            <label>Beton / Tidak<input name="materi" id="kfMateri" list="kfMateriList"
                                    placeholder="Cari pilihan"><datalist id="kfMateriList">
                                    <option value="BETON"></option>
                                    <option value="TIDAK BETON"></option>
                                </datalist></label>
                            <label>Letak / Lokasi Alamat<input name="letak" id="kfLetak" maxlength="500"
                                    placeholder="Contoh: Jl. Sultan Alimudin"></label>
                            <label>Status Tanah<input name="status_tanah" id="kfStatusTanah" list="kfStatusTanahList"
                                    maxlength="255" placeholder="Contoh: Pemkot"><datalist id="kfStatusTanahList">
                                    <option value="Pemkot"></option>
                                    <option value="Hak Pakai"></option>
                                    <option value="Milik Perumda"></option>
                                </datalist></label>
                            <label>Asal Usul Pembiayaan<input name="asal" id="kfAsal" list="kfAsalList"
                                    maxlength="255" placeholder="Contoh: Pemprov"><datalist id="kfAsalList">
                                    <option value="Pemprov"></option>
                                    <option value="Pemkot"></option>
                                    <option value="Perumda"></option>
                                    <option value="Hibah"></option>
                                </datalist></label>
                            <label>Status Aset<input name="status_aset" id="kfStatusAset" list="kfStatusList"
                                    maxlength="255" placeholder="Contoh: Serah Terima"><datalist id="kfStatusList">
                                    <option value="Serah Terima"></option>
                                    <option value="Dalam Pengerjaan"></option>
                                    <option value="Selesai"></option>
                                </datalist></label>
                            <label class="kf-full">Nilai Konstruksi (Rp) <em>*</em><input type="number" name="nilai"
                                    id="kfNilai" min="0" step="0.01" required
                                    placeholder="11234500000"><small>Isi nilai secara manual; tidak mengambil data dari
                                    modul Nilai Aset.</small></label>
                        </div>
                    </fieldset>

                    <fieldset class="kf-fieldset">
                        <legend><span>3</span> Uraian Pekerjaan dan Berita Acara</legend>
                        <div class="kf-fields">
                            <label class="kf-full">Uraian Pekerjaan <em>*</em>
                                <textarea name="urai" id="kfUrai" required rows="7"
                                    placeholder="Contoh:
1. Pekerjaan persiapan dan pengukuran
2. Pengadaan dan pemasangan pipa distribusi
3. Pengadaan aksesori pipa
4. Pengujian dan serah terima pekerjaan"></textarea><small>Tulis pekerjaan per baris atau gunakan nomor. Baris baru
                                    dipertahankan dalam tabel dan detail.</small>
                            </label>
                            <label class="kf-full">Keterangan / Dokumen Pendukung
                                <textarea name="ket" id="kfKet" rows="4"
                                    placeholder="Nomor berita acara, tanggal, kontraktor, nomor kontrak, dan keterangan lainnya."></textarea>
                            </label>
                        </div>
                    </fieldset>

                    <fieldset class="kf-fieldset">
                        <legend><span>4</span> Lampiran Pendukung</legend>
                        <div class="kf-fields">
                            <label>Foto Utama Konstruksi<input name="foto" id="kfFoto" type="file"
                                    accept="image/jpeg,image/png,image/webp"><small>Foto opsional, maksimum 5
                                    MB.</small></label>
                            <label>Dokumen Pendukung (Banyak File)<input name="dokumens[]" id="kfDokumens" type="file"
                                    multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"><small>PDF atau
                                    gambar; dapat memilih lebih dari 3 file. Ukuran mengikuti kapasitas
                                    server.</small></label>
                            <div class="kf-full" id="kfSelectedFiles" aria-live="polite"></div>
                            <div class="kf-full" id="kfSavedFiles"></div>
                        </div>
                    </fieldset>
                </div>
                <footer class="kf-dialog-foot"><button type="button" class="kf-btn kf-outline"
                        data-kf-close="kfModalForm">Batal</button><button type="submit" class="kf-btn kf-primary"
                        id="kfSimpan"><i data-lucide="save"></i> Simpan Konstruksi</button></footer>
            </form>
        </dialog>

        <dialog id="kfModalDetail" class="kf-dialog" aria-labelledby="kfDetailTitle">
            <header class="kf-dialog-head">
                <div><small>DETAIL K.I.B F</small>
                    <h2 id="kfDetailTitle">Detail Konstruksi</h2>
                </div><button type="button" class="kf-x" data-kf-close="kfModalDetail"><i
                        data-lucide="x"></i></button>
            </header>
            <div id="kfDetailBody" class="kf-dialog-body"></div>
            <footer class="kf-dialog-foot"><button type="button" class="kf-btn kf-outline"
                    data-kf-close="kfModalDetail">Tutup</button><button type="button" class="kf-btn kf-outline"
                    id="kfEdit">Edit</button><button type="button" class="kf-btn kf-danger"
                    id="kfHapus">Hapus</button></footer>
        </dialog>
        <div id="kfToast" class="kf-toast" hidden role="status"></div>
    </section>

    <script>
        (function() {
            'use strict';
            const dateEl = document.getElementById('kfTanggal');
            const timeEl = document.getElementById('kfJam');
            if (!dateEl || !timeEl) return;

            const dateFormat = new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            const timeFormat = new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            function updateWitaClock() {
                const now = new Date();
                const dateText = dateFormat.format(now);
                dateEl.textContent = dateText.charAt(0).toUpperCase() + dateText.slice(1);
                timeEl.textContent = timeFormat.format(now).replace(/\./g, ':');
            }
            updateWitaClock();
            setInterval(updateWitaClock, 1000);
        })();
    </script>

    <script
        src="{{ asset('js/pages/kib/konstruksi.js') }}?v={{ file_exists(public_path('js/pages/kib/konstruksi.js')) ? filemtime(public_path('js/pages/kib/konstruksi.js')) : '1' }}">
    </script>
@endsection
