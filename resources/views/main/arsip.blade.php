@extends('layouts.main')
@section('title', 'Arsip Aset')
@push('styles')
    <link rel="stylesheet" href="{{ asset('css/pages/arsip.css') }}?v={{ filemtime(public_path('css/pages/arsip.css')) }}">
@endpush
@section('content')
    <section class="content arsip-page" id="arsipPage" data-indices="{{ $indices->toJson() }}"
        data-reopen="{{ $errors->any() && old('arsip_form') ? '1' : '0' }}">
        <header class="ar-header">
            <div>
                <span class="ar-eyebrow">DOCUMENT MANAGEMENT</span>
                <h1>Arsip Aset</h1>
                <p>Kelola dokumentasi aset, lokasi penyimpanan fisik, dan retensi perusahaan secara rapi dan terstruktur.
                </p>
            </div>
            <div class="ar-header-actions">
                <div class="ar-clock">
                    <i data-lucide="calendar-days"></i>
                    <div>
                        <strong id="arDate">{{ now('Asia/Makassar')->translatedFormat('l, d F Y') }}</strong>
                        <small id="arTime">{{ now('Asia/Makassar')->format('H:i') }} WITA</small>
                    </div>
                </div>
                <button class="ar-btn ar-primary" type="button" id="arAdd"><i data-lucide="plus"></i> Tambah
                    Arsip</button>
            </div>
        </header>
        @if (session('arsip_success'))
            <div class="ar-alert ar-ok" role="status">{{ session('arsip_success') }}</div>
        @endif
        @if ($errors->any())
            <div class="ar-alert ar-error" role="alert">
                <strong>Data belum dapat disimpan atau filter tidak valid.</strong>
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
        <div class="ar-kpis">
            <article class="ar-kpi">
                <div class="ar-kpi-icon"><i data-lucide="file-text"></i></div>
                <div>
                    <span>Total Arsip</span>
                    <strong>{{ number_format($stats['total'], 0, ',', '.') }}</strong>
                    <small>Seluruh dokumen terdaftar</small>
                </div>
                <i class="ar-kpi-deco" data-lucide="files"></i>
            </article>
            <article class="ar-kpi">
                <div class="ar-kpi-icon"><i data-lucide="building-2"></i></div>
                <div>
                    <span>Gedung</span>
                    <strong>{{ number_format($stats['buildings'], 0, ',', '.') }}</strong>
                    <small>Gedung penyimpanan legacy</small>
                </div>
                <i class="ar-kpi-deco" data-lucide="building"></i>
            </article>
            <article class="ar-kpi">
                <div class="ar-kpi-icon ar-purple"><i data-lucide="archive"></i></div>
                <div>
                    <span>Filling / Rak</span>
                    <strong>{{ $stats['fillings'] }} / {{ $stats['racks'] }}</strong>
                    <small>Struktur penyimpanan unik</small>
                </div>
                <i class="ar-kpi-deco" data-lucide="layers"></i>
            </article>
            <article class="ar-kpi">
                <div class="ar-kpi-icon ar-orange"><i data-lucide="clock"></i></div>
                <div>
                    <span>Retensi Mendekati Akhir</span>
                    <strong>{{ $stats['near'] }}</strong>
                    <small>{{ $stats['expired'] }} berakhir · 90 hari ke depan</small>
                </div>
                <i class="ar-kpi-deco" data-lucide="calendar-clock"></i>
            </article>
        </div>
        <div class="ar-workspace" id="arWorkspace">
            <div class="ar-main">
                <section class="ar-card ar-location">
                    <h2>Lokasi Penyimpanan</h2>
                    <p class="ar-muted">Pilih Gedung, Filling, Rak, dan Baris berdasarkan indeks penyimpanan arsip fisik.
                    </p>
                    <div class="ar-location-grid">
                        <button class="ar-location-item" type="button" data-focus="arBuilding">
                            <i data-lucide="building-2"></i>
                            <span>
                                <strong id="arPathBuilding">Semua Gedung</strong>
                                <small>Gedung</small>
                            </span>
                        </button>
                        <i class="ar-arrow" data-lucide="chevron-right"></i>
                        <button class="ar-location-item" type="button" data-focus="arFilling">
                            <i data-lucide="archive"></i>
                            <span>
                                <strong id="arPathFilling">Semua Filling</strong>
                                <small>Filling</small>
                            </span>
                        </button>
                        <i class="ar-arrow" data-lucide="chevron-right"></i>
                        <button class="ar-location-item" type="button" data-focus="arRack">
                            <i data-lucide="layers"></i>
                            <span>
                                <strong id="arPathRack">Semua Rak</strong>
                                <small>Rak</small>
                            </span>
                        </button>
                        <i class="ar-arrow" data-lucide="chevron-right"></i>
                        <button class="ar-location-item" type="button" data-focus="arIndex">
                            <i data-lucide="grid-2x2"></i>
                            <span>
                                <strong id="arPathIndex">Semua Baris</strong>
                                <small>Baris / Indeks</small>
                            </span>
                        </button>
                    </div>
                    <div class="ar-quick">
                        <strong>Gedung lainnya</strong>
                        <div id="arQuickBuildings" class="ar-quick-items"></div>
                    </div>
                </section>
                {{-- Penelusuran indeks fisik: Gedung → Filling → Rak → Baris --}}
                <section class="ar-card ar-index-browser" id="arIndexBrowser" aria-labelledby="arBrowserHeading">
                    <div class="ar-card-heading">
                        <div>
                            <h2 id="arBrowserHeading">Penelusuran Indeks Arsip</h2>
                            <p class="ar-muted">Pilih rak untuk melihat seluruh baris penyimpanan, termasuk yang belum
                                memiliki dokumen.</p>
                        </div>
                    </div>
                    <div class="ar-browser-layout">
                        <nav class="ar-browser-tree" aria-label="Struktur penyimpanan">
                            <label for="arBrowserBuilding">Gedung</label>
                            <select id="arBrowserBuilding">
                                <option value="">Pilih Gedung</option>
                            </select>
                            <div id="arBrowserTree" class="ar-tree-groups"></div>
                        </nav>
                        <div class="ar-browser-content">
                            <div class="ar-browser-context" id="arBrowserContext" aria-live="polite">Pilih Gedung dan Rak.
                            </div>
                            <div class="ar-browser-controls">
                                <label for="arBrowserSearch">Cari indeks pada rak</label>
                                <input id="arBrowserSearch" type="search" maxlength="200"
                                    placeholder="Baris, dokumen, kode, bulan, tahun..." disabled>
                            </div>
                            <div class="ar-table-wrap">
                                <table class="ar-table ar-index-table">
                                    <thead>
                                        <tr>
                                            <th>No. Baris</th>
                                            <th>Nama Dokumen</th>
                                            <th>Bulan</th>
                                            <th>Kode Dokumen</th>
                                            <th>Tahun</th>
                                            <th>Isi</th>
                                            <th>Tambah Dokumen</th>
                                        </tr>
                                    </thead>
                                    <tbody id="arBrowserRows"></tbody>
                                </table>
                            </div>
                            <div class="ar-footer ar-browser-footer">
                                <span id="arBrowserCount" aria-live="polite"></span>
                                <div class="ar-browser-pages">
                                    <label for="arBrowserSize">Per halaman</label>
                                    <select id="arBrowserSize">
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
                                    <button type="button" class="ar-btn ar-light" id="arBrowserPrev"
                                        aria-label="Halaman indeks sebelumnya">‹</button>
                                    <span id="arBrowserPage">1 / 1</span>
                                    <button type="button" class="ar-btn ar-light" id="arBrowserNext"
                                        aria-label="Halaman indeks berikutnya">›</button>
                                </div>
                            </div>
                            <p class="ar-muted ar-browser-help">Klik nomor baris untuk membuka isi dokumen. Tombol +
                                mengisi indeks secara otomatis.</p>
                        </div>
                    </div>
                    <noscript>
                        <p>Aktifkan JavaScript untuk menelusuri indeks.</p>
                    </noscript>
                </section>
                <section class="ar-card ar-filter">
                    <h2>Filter Dokumen Arsip</h2>
                    <form id="arFilter" method="GET" action="{{ route('main.arsip') }}">
                        <div class="ar-filter-grid">
                            <label class="ar-span2">
                                Pencarian
                                <div class="ar-search">
                                    <i data-lucide="search"></i>
                                    <input name="q" value="{{ $filters['q'] ?? '' }}"
                                        placeholder="Cari judul, register, atau kode dokumen..." maxlength="200">
                                </div>
                            </label>
                            <label>
                                Gedung
                                <select name="gedung" id="arBuilding" data-current="{{ $filters['gedung'] ?? '' }}">
                                    <option value="">Semua Gedung</option>
                                </select>
                            </label>
                            <label>
                                Filling
                                <select name="fill" id="arFilling" data-current="{{ $filters['fill'] ?? '' }}">
                                    <option value="">Semua Filling</option>
                                </select>
                            </label>
                            <label>
                                Rak
                                <select name="rak" id="arRack" data-current="{{ $filters['rak'] ?? '' }}">
                                    <option value="">Semua Rak</option>
                                </select>
                            </label>
                            <label class="ar-span2">
                                Baris / Indeks Dokumen
                                <select name="index_id" id="arIndex" data-current="{{ $filters['index_id'] ?? '' }}">
                                    <option value="">Semua Baris / Indeks</option>
                                </select>
                            </label>
                            <label>
                                Tahun
                                <select name="tahun" id="arYear" data-current="{{ $filters['tahun'] ?? '' }}">
                                    <option value="">Semua Tahun</option>
                                </select>
                            </label>
                            <label>
                                Kondisi
                                <select name="kondisi">
                                    <option value="">Semua Kondisi</option>
                                    @foreach ($conditions as $condition)
                                        <option value="{{ $condition }}" @selected(($filters['kondisi'] ?? '') === $condition)>
                                            {{ $condition }}</option>
                                    @endforeach
                                </select>
                            </label>
                            <label>
                                Retensi
                                <select name="retensi_status">
                                    <option value="">Semua Retensi</option>
                                    @foreach (['near' => 'Mendekati akhir (90 hari)', 'expired' => 'Berakhir', 'unknown' => 'Tanggal belum diatur', 'active' => 'Dalam retensi'] as $key => $value)
                                        <option value="{{ $key }}" @selected(($filters['retensi_status'] ?? '') === $key)>
                                            {{ $value }}</option>
                                    @endforeach
                                </select>
                            </label>
                        </div>
                        <div class="ar-filter-actions">
                            <label class="ar-muted">
                                Per halaman
                                <select name="per_page">
                                    @foreach ([10, 25, 50, 100] as $size)
                                        <option value="{{ $size }}" @selected((int) ($filters['per_page'] ?? 10) === $size)>
                                            {{ $size }}</option>
                                    @endforeach
                                </select>
                            </label>
                            <button class="ar-btn ar-primary" type="submit"><i data-lucide="filter"></i> Filter</button>
                            <a class="ar-btn ar-light" href="{{ route('main.arsip') }}"><i
                                    data-lucide="refresh-ccw"></i> Reset</a>
                        </div>
                    </form>
                </section>
                <section class="ar-card ar-list" id="arDocumentList">
                    <div class="ar-card-heading">
                        <h2>{{ $selectedIndex ? 'Isi Dokumen Arsip' : 'Daftar Dokumen Arsip' }}</h2>
                        <a class="ar-btn ar-outline"
                            href="{{ route('arsip.export', array_filter($filters, fn($v) => $v !== null && $v !== '')) }}"><i
                                data-lucide="download"></i> Ekspor CSV</a>
                    </div>
                    @if ($selectedIndex)
                        <div class="ar-index-context">
                            <div>
                                <strong>Gedung {{ $selectedIndex->gedung ?? '—' }} / Filling
                                    {{ $selectedIndex->fill ?? '—' }} / Rak {{ $selectedIndex->rak ?? '—' }} / Baris
                                    {{ $selectedIndex->no_file ?? '—' }}</strong>
                                <p>{{ $selectedIndex->nama_dok ?? 'Indeks tanpa nama' }} · Kode
                                    {{ $selectedIndex->kode_dok ?? '—' }} · {{ $selectedIndex->jumlah_dokumen }} dokumen ·
                                    ID indeks #{{ $selectedIndex->id }}</p>
                            </div>
                            <div class="ar-index-context-actions">
                                <button type="button" class="ar-btn ar-primary"
                                    data-add-index="{{ $selectedIndex->id }}">+ Tambah Dokumen</button>
                                <a class="ar-btn ar-light" href="#arIndexBrowser">Kembali ke indeks</a>
                            </div>
                        </div>
                    @endif
                    <div class="ar-table-wrap">
                        <table class="ar-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Dokumen</th>
                                    <th>Register</th>
                                    @if ($selectedIndex)
                                        <th>Rekanan</th>
                                        <th>Nilai Rp</th>
                                        <th>Keterangan</th>
                                    @else
                                        <th>Penyimpanan</th>
                                        <th>Tahun</th>
                                    @endif
                                    <th>Retensi</th>
                                    <th>Kondisi</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($rows as $item)
                                    <tr data-row="{{ json_encode($item, JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR) }}"
                                        data-id="{{ $item['id'] }}">
                                        <td>{{ $rows->firstItem() + $loop->index }}</td>
                                        <td>
                                            <button type="button" class="ar-title-link"
                                                data-act="detail">{{ $item['judul'] ?? 'Dokumen tanpa judul' }}</button>
                                            <small>{{ $item['nama_dok'] ?? '—' }} · #{{ $item['id'] }}</small>
                                        </td>
                                        <td>{{ $item['reg'] ?? '—' }}</td>
                                        @if ($selectedIndex)
                                            <td>{{ $item['rekanan'] ?? '—' }}</td>
                                            <td>{{ $item['nilai'] === null ? '—' : preg_replace('/\B(?=(\d{3})+(?!\d))/', '.', $item['nilai']) }}
                                            </td>
                                            <td class="ar-index-note">{{ $item['ket'] ?? '—' }}</td>
                                        @else
                                            <td>
                                                @if ($item['gedung'] !== null)
                                                    Gedung {{ $item['gedung'] }} / Filling {{ $item['fill'] ?? '—' }} /
                                                    Rak {{ $item['rak'] ?? '—' }} / Baris {{ $item['no_file'] ?? '—' }}
                                                @else
                                                    <span class="ar-muted">Indeks belum tersedia</span>
                                                @endif
                                            </td>
                                            <td>{{ $item['tahun'] ?? '—' }}</td>
                                        @endif
                                        <td>
                                            <span>{{ $item['retensi'] ?? '—' }}</span>
                                            <small
                                                class="ar-retention {{ 'ar-' . $item['retention']['key'] }}">{{ $item['retention']['label'] }}</small>
                                        </td>
                                        <td>
                                            <span
                                                class="ar-pill {{ in_array(strtolower($item['kondisi'] ?? ''), ['baik', 'lengkap'], true) ? 'ar-good' : '' }}">{{ $item['kondisi'] ?? 'Belum diatur' }}</span>
                                        </td>
                                        <td>
                                            <div class="ar-row-actions">
                                                <button type="button" class="ar-icon-btn" data-act="detail"
                                                    title="Lihat detail" aria-label="Lihat detail"><i
                                                        data-lucide="eye"></i></button>
                                                <button type="button" class="ar-icon-btn ar-edit" data-act="edit"
                                                    title="Edit arsip" aria-label="Edit arsip"><i
                                                        data-lucide="pencil"></i></button>
                                                @if ($item['has_file'])
                                                    <a class="ar-icon-btn ar-download" href="{{ $item['download_url'] }}"
                                                        title="Download PDF" aria-label="Download PDF"><i
                                                            data-lucide="download"></i></a>
                                                @else
                                                    <button class="ar-icon-btn" disabled title="Belum ada PDF"
                                                        aria-label="Belum ada PDF"><i data-lucide="download"></i></button>
                                                @endif
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="{{ $selectedIndex ? 9 : 8 }}" class="ar-empty">
                                            <i data-lucide="folder-open"></i>
                                            <strong>Belum ada dokumen yang sesuai.</strong>
                                            <span>{{ $selectedIndex ? 'Tambahkan dokumen pada indeks ini atau ubah filter.' : 'Ubah filter atau tambahkan arsip baru.' }}</span>
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>
                    <div class="ar-footer">
                        <span>Menampilkan {{ $rows->firstItem() ?? 0 }}–{{ $rows->lastItem() ?? 0 }} dari
                            {{ number_format($rows->total(), 0, ',', '.') }} dokumen</span>
                        <nav class="ar-pager" aria-label="Halaman arsip">
                            @if ($rows->onFirstPage())
                                <span aria-disabled="true">‹</span>
                            @else
                                <a href="{{ $rows->previousPageUrl() }}" aria-label="Sebelumnya">‹</a>
                            @endif
                            @for ($p = max(1, $rows->currentPage() - 2); $p <= min($rows->lastPage(), $rows->currentPage() + 2); $p++)
                                <a href="{{ $rows->url($p) }}"
                                    @if ($p === $rows->currentPage()) class="ar-current" aria-current="page" @endif>{{ $p }}</a>
                            @endfor
                            @if ($rows->hasMorePages())
                                <a href="{{ $rows->nextPageUrl() }}" aria-label="Berikutnya">›</a>
                            @else
                                <span aria-disabled="true">›</span>
                            @endif
                        </nav>
                    </div>
                </section>
            </div>
            <aside class="ar-card ar-detail" id="arDetail" aria-label="Detail Arsip">
                <div class="ar-card-heading">
                    <h2>Detail Arsip</h2>
                    <button class="ar-icon-btn" type="button" id="arCloseDetail" aria-label="Tutup detail"><i
                            data-lucide="x"></i></button>
                </div>
                <div id="arDetailEmpty" class="ar-muted">Pilih dokumen untuk melihat detail.</div>
                <div id="arDetailBody" hidden>
                    <div class="ar-detail-title">
                        <div class="ar-detail-icon"><i data-lucide="file-text"></i></div>
                        <div>
                            <h3 data-detail="judul"></h3>
                            <span class="ar-pill" data-detail="kondisi"></span>
                        </div>
                    </div>
                    <h4><i data-lucide="info"></i> Informasi Dokumen</h4>
                    <dl>
                        <dt>ID Arsip</dt>
                        <dd data-detail="id"></dd>
                        <dt>Kode Dokumen</dt>
                        <dd data-detail="kode_dok"></dd>
                        <dt>Register</dt>
                        <dd data-detail="reg"></dd>
                        <dt>Nama Indeks</dt>
                        <dd data-detail="nama_dok"></dd>
                        <dt>Rekanan / Sumber</dt>
                        <dd data-detail="rekanan"></dd>
                        <dt>Tahun Dokumen</dt>
                        <dd data-detail="tahun"></dd>
                        <dt>Nilai Aset</dt>
                        <dd data-detail="nilai"></dd>
                        <dt>Keterangan</dt>
                        <dd data-detail="ket"></dd>
                    </dl>
                    <h4><i data-lucide="archive"></i> Lokasi Penyimpanan</h4>
                    <dl>
                        <dt>Gedung</dt>
                        <dd data-detail="gedung"></dd>
                        <dt>Filling</dt>
                        <dd data-detail="fill"></dd>
                        <dt>Rak</dt>
                        <dd data-detail="rak"></dd>
                        <dt>Baris</dt>
                        <dd data-detail="no_file"></dd>
                    </dl>
                    <h4><i data-lucide="clock"></i> Informasi Retensi</h4>
                    <dl>
                        <dt>Masa Retensi</dt>
                        <dd data-detail="retensi"></dd>
                        <dt>Tanggal Berakhir</dt>
                        <dd data-detail="retensi_akhir"></dd>
                        <dt>Sisa Waktu</dt>
                        <dd data-detail="remaining"></dd>
                        <dt>Status</dt>
                        <dd data-detail="retention_label"></dd>
                    </dl>
                    <h4><i data-lucide="paperclip"></i> Dokumen Digital</h4>
                    <p class="ar-muted" data-detail="file_name"></p>
                    <div class="ar-detail-actions">
                        <a class="ar-btn ar-outline" id="arViewPdf" target="_blank" rel="noopener noreferrer"><i
                                data-lucide="eye"></i> Lihat Dokumen</a>
                        <a class="ar-btn ar-primary" id="arDownloadPdf"><i data-lucide="download"></i> Download</a>
                        <button type="button" id="arDetailEdit" class="ar-btn ar-light"><i data-lucide="pencil"></i>
                            Edit Arsip</button>
                    </div>
                </div>
            </aside>
        </div>
        <dialog class="ar-dialog" id="arDialog" aria-labelledby="arDialogTitle">
            @php($editingId = (int) old('editing_id', 0))
            <form id="arForm" method="POST" enctype="multipart/form-data"
                action="{{ $editingId > 0 ? route('arsip.update', ['arsip' => $editingId]) : route('arsip.store') }}"
                data-store="{{ route('arsip.store') }}">
                @csrf
                <input type="hidden" name="_method" id="arMethod" value="PUT" @disabled($editingId <= 0)>
                <input type="hidden" name="arsip_form" value="1">
                <input type="hidden" name="editing_id" value="{{ $editingId }}">
                <header class="ar-dialog-head">
                    <div>
                        <span class="ar-eyebrow">DOKUMEN ASET</span>
                        <h2 id="arDialogTitle">{{ $editingId > 0 ? 'Edit Arsip' : 'Tambah Arsip' }}</h2>
                        <p class="ar-muted">Simpan metadata dokumen dan lokasi fisik sesuai indeks legacy.</p>
                    </div>
                    <button class="ar-icon-btn" type="button" data-close-dialog aria-label="Tutup"><i
                            data-lucide="x"></i></button>
                </header>
                <div class="ar-dialog-body">
                    @if ($errors->any() && old('arsip_form'))
                        <div class="ar-alert ar-error">
                            @foreach ($errors->all() as $error)
                                <div>{{ $error }}</div>
                            @endforeach
                        </div>
                    @endif
                    <h3>Informasi Dokumen</h3>
                    <div class="ar-form-grid">
                        <label class="ar-span2">
                            Judul Dokumen *
                            <input name="judul" required maxlength="2000" value="{{ old('judul') }}">
                        </label>
                        <label>
                            Nomor Register
                            <input name="reg" maxlength="255" value="{{ old('reg') }}">
                        </label>
                        <label>
                            Kondisi
                            <input name="kondisi" list="arConditions" maxlength="255" value="{{ old('kondisi') }}"
                                placeholder="Contoh: Baik">
                            <datalist id="arConditions">
                                @foreach ($conditions as $condition)
                                    <option value="{{ $condition }}">
                                @endforeach
                            </datalist>
                        </label>
                        <label>
                            Rekanan / Sumber
                            <input name="rekanan" maxlength="255" value="{{ old('rekanan') }}">
                        </label>
                        <label>
                            Nilai Rp
                            <input name="nilai" inputmode="numeric" pattern="-?[0-9]+" value="{{ old('nilai') }}"
                                placeholder="Tanpa titik atau koma">
                        </label>
                        <label>
                            Masa Retensi
                            <input name="retensi" maxlength="255" value="{{ old('retensi') }}"
                                placeholder="Contoh: 10 tahun">
                        </label>
                        <label>
                            Tanggal Akhir Retensi
                            <input name="retensi_akhir" type="date" value="{{ old('retensi_akhir') }}">
                            <small>Tanggal resmi, bukan hasil perkiraan dari teks retensi.</small>
                        </label>
                        <label class="ar-span2">
                            Keterangan
                            <textarea name="ket" rows="3" maxlength="10000">{{ old('ket') }}</textarea>
                        </label>
                        <label class="ar-span2">
                            Dokumen PDF (opsional, maks. 20 MB)
                            <input name="pdf" type="file" accept="application/pdf,.pdf">
                            <small id="arFileHint">Unggah PDF jika dokumen digital tersedia.</small>
                        </label>
                    </div>
                    <h3>Lokasi Penyimpanan</h3>
                    <div class="ar-index-choice">
                        <label>
                            <input type="radio" name="index_mode" value="existing" @checked(old('index_mode', 'existing') === 'existing')>
                            Gunakan indeks yang sudah ada
                        </label>
                        <label>
                            <input type="radio" name="index_mode" value="new" @checked(old('index_mode') === 'new')>
                            Buat indeks baru
                        </label>
                    </div>
                    <div id="arExistingIndex">
                        <label>
                            Cari indeks penyimpanan
                            <input id="arIndexSearch" placeholder="Gedung, filling, rak, baris atau judul indeks...">
                        </label>
                        <label>
                            Indeks Dokumen *
                            <select name="id_indeks" id="arFormIndex" data-current="{{ old('id_indeks') }}">
                                <option value="">Pilih indeks</option>
                            </select>
                        </label>
                        <p class="ar-muted" id="arIndexInfo"></p>
                    </div>
                    <div id="arNewIndex" class="ar-form-grid" hidden>
                        <div class="ar-note ar-span2">Indeks baru tidak mengubah indeks legacy yang mungkin dipakai oleh
                            dokumen lain.</div>
                        <label>
                            Gedung (nomor) *
                            <input type="number" min="1" max="2147483647" name="gedung"
                                value="{{ old('gedung') }}" data-required>
                        </label>
                        <label>
                            Filling (nomor) *
                            <input type="number" min="1" max="2147483647" name="fill"
                                value="{{ old('fill') }}" data-required>
                        </label>
                        <label>
                            Rak *
                            <input name="rak" maxlength="255" value="{{ old('rak') }}" data-required>
                        </label>
                        <label>
                            Baris / No. File *
                            <input type="number" min="1" max="2147483647" name="no_file"
                                value="{{ old('no_file') }}" data-required>
                        </label>
                        <label>
                            Nama Dokumen Indeks *
                            <input name="nama_dok" maxlength="255" value="{{ old('nama_dok') }}" data-required>
                        </label>
                        <label>
                            Kode Dokumen (angka)
                            <input type="number" min="0" max="2147483647" name="kode_dok"
                                value="{{ old('kode_dok') }}">
                        </label>
                        <label>
                            Bulan
                            <input type="number" min="1" max="12" name="bulan"
                                value="{{ old('bulan') }}">
                        </label>
                        <label>
                            Tahun
                            <input type="number" min="1900" max="2200" name="tahun"
                                value="{{ old('tahun') }}">
                        </label>
                        <label>
                            Departemen (opsional)
                            <select name="id_departemen" id="arDepartment">
                                <option value="">Pilih Departemen</option>
                                @foreach ($departments as $department)
                                    <option value="{{ $department->id }}" @selected((string) old('id_departemen') === (string) $department->id)>
                                        {{ trim($department->nama_dep) }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label>
                            Divisi (opsional)
                            <select name="id_div" id="arDivision" data-current="{{ old('id_div') }}">
                                <option value="">Pilih Divisi</option>
                                @foreach ($divisions as $division)
                                    <option value="{{ $division->id }}" data-dep="{{ $division->id_dep }}"
                                        @selected((string) old('id_div') === (string) $division->id)>{{ trim($division->nama_div) }}</option>
                                @endforeach
                            </select>
                        </label>
                        <label class="ar-span2">
                            Keterangan Indeks
                            <textarea name="index_ket" maxlength="10000" rows="2">{{ old('index_ket') }}</textarea>
                        </label>
                    </div>
                </div>
                <footer class="ar-dialog-footer">
                    <button class="ar-btn ar-outline" type="button" data-close-dialog>Batal</button>
                    <button class="ar-btn ar-primary" type="submit"><i data-lucide="save"></i> Simpan Arsip</button>
                </footer>
            </form>
        </dialog>
    </section>
@endsection
@push('scripts')
    <script src="{{ asset('js/pages/arsip.js') }}?v={{ filemtime(public_path('js/pages/arsip.js')) }}"></script>
@endpush
    