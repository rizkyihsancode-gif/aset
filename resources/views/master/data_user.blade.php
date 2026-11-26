@extends('layouts.main')

@section('title', 'Data User')

@push('styles')
    <link rel="stylesheet"
        href="{{ asset('css/pages/master/user.css') }}?v={{ filemtime(public_path('css/pages/master/user.css')) }}">
@endpush

@section('content')
    <section class="content aset-user-page" id="asetUserPage" data-store-url="{{ route('master.data_user.store') }}">

        <header class="au-hero">
            <nav class="au-breadcrumb" aria-label="Breadcrumb">
                <a href="{{ route('dashboard') }}"><i data-lucide="house"></i> Dashboard</a>
                <i data-lucide="chevron-right"></i>
                <span>Master Data</span>
                <i data-lucide="chevron-right"></i>
                <strong>Data User</strong>
            </nav>
            <div class="au-heading">
                <div>
                    <small>USER ACCESS MANAGEMENT</small>
                    <h1>Data User</h1>
                    <p>Kelola pengguna, role dan penugasan inventaris Sistem Aset.</p>
                </div>
                <button class="au-button au-primary" type="button" id="auAdd">
                    <i data-lucide="user-plus"></i> Tambah User
                </button>
            </div>
            <div class="au-kpis">
                @foreach ([['key' => 'total', 'label' => 'Total Akun', 'icon' => 'users'], ['key' => 'master', 'label' => 'Master Aktif', 'icon' => 'shield-check'], ['key' => 'user', 'label' => 'User Aktif', 'icon' => 'user-cog'], ['key' => 'viewer', 'label' => 'Viewer Aktif', 'icon' => 'eye']] as $card)
                    <div class="au-kpi">
                        <span class="au-kpi-icon au-icon-{{ $card['key'] }}"><i
                                data-lucide="{{ $card['icon'] }}"></i></span>
                        <div>
                            <span>{{ $card['label'] }}</span>
                            <strong>{{ number_format($counts[$card['key']], 0, ',', '.') }}</strong>
                        </div>
                    </div>
                @endforeach
            </div>
        </header>

        @if (session('success'))
            <div class="au-alert au-success" role="status">{{ session('success') }}</div>
        @endif
        @if ($errors->any())
            <div class="au-alert au-error" role="alert">
                <strong>Perubahan belum disimpan.</strong>
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <section class="au-card" aria-labelledby="auTableTitle">
            <div class="au-card-heading">
                <div>
                    <h2 id="auTableTitle">Daftar Data User</h2>
                    <p>Akun existing dapat diberi akses melalui tombol Edit Akses.</p>
                </div>
                <span class="au-count" id="auCount" aria-live="polite">{{ $rows->count() }} akun</span>
            </div>
            <div class="au-filters">
                <label>
                    <span>Pencarian</span>
                    <input id="auSearch" type="search" placeholder="Cari nama atau email..." autocomplete="off">
                </label>
                <label>
                    <span>Role</span>
                    <select id="auRoleFilter">
                        <option value="">Semua Role</option>
                        <option value="master">Master</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                        <option value="unassigned">Belum diatur</option>
                    </select>
                </label>
                <label>
                    <span>Status</span>
                    <select id="auStatusFilter">
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Nonaktif</option>
                        <option value="unassigned">Belum diatur</option>
                    </select>
                </label>
                <button class="au-button au-secondary" type="button" id="auReset"><i data-lucide="rotate-ccw"></i>
                    Reset</button>
            </div>
            <div class="au-table-wrap">
                <table class="au-table">
                    <thead>
                        <tr>
                            <th scope="col">No</th>
                            <th scope="col">Nama Pengguna</th>
                            <th scope="col">Email</th>
                            <th scope="col">Role</th>
                            <th scope="col">Status Aset</th>
                            <th scope="col">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($rows as $row)
                            <tr data-user-row data-role="{{ $row['role'] ?? 'unassigned' }}"
                                data-status="{{ $row['role'] === null ? 'unassigned' : ($row['active'] ? 'active' : 'inactive') }}"
                                data-search="{{ $row['name'] . ' ' . $row['email'] }}">
                                <td data-row-number>{{ $loop->iteration }}</td>
                                <td><strong>{{ $row['name'] }}</strong></td>
                                <td>{{ $row['email'] }}</td>
                                <td><span
                                        class="au-role au-role-{{ $row['role'] ?? 'unassigned' }}">{{ $row['role_label'] }}</span>
                                </td>
                                <td>
                                    <span class="au-status {{ $row['active'] ? 'is-active' : '' }}">
                                        {{ $row['role'] === null ? 'Belum diatur' : ($row['active'] ? 'Aktif' : 'Nonaktif') }}
                                    </span>
                                </td>
                                <td>
                                    <button type="button" class="au-button au-secondary" data-edit-user
                                        data-url="{{ route('master.data_user.update', $row['id']) }}"
                                        data-user="{{ json_encode($row, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE) }}">
                                        <i data-lucide="square-pen"></i> Edit Akses
                                    </button>
                                </td>
                            </tr>
                        @endforeach
                        <tr id="auEmpty" @if ($rows->isNotEmpty()) hidden @endif>
                            <td colspan="6" class="au-empty">Tidak ada pengguna yang sesuai.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="au-footer">
                <span id="auPageInfo" aria-live="polite"></span>
                <label>Per halaman
                    <select id="auPageSize">
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                    </select>
                </label>
                <button type="button" class="au-button au-secondary" id="auPrev"
                    aria-label="Halaman sebelumnya">‹</button>
                <button type="button" class="au-button au-secondary" id="auNext"
                    aria-label="Halaman berikutnya">›</button>
            </div>
        </section>

        <dialog class="au-dialog" id="auDialog" aria-labelledby="auDialogTitle">
            <form method="POST" action="{{ route('master.data_user.store') }}" id="auForm">
                @csrf
                <input type="hidden" name="_method" value="PUT" id="auMethod" disabled>
                <header class="au-dialog-header">
                    <div>
                        <small>USER ACCESS MANAGEMENT</small>
                        <h2 id="auDialogTitle">Tambah User</h2>
                    </div>
                    <button class="au-button au-secondary" type="button" data-close-dialog aria-label="Tutup">×</button>
                </header>
                <div class="au-dialog-body">
                    <div id="auNewIdentity">
                        <p class="au-note">Untuk akun yang sudah ada, gunakan Edit Akses. Tambah User membuat identitas
                            baru pada tabel users yang juga digunakan aplikasi legacy.</p>
                        <div class="au-fields">
                            <label>Nama lengkap<input name="name" maxlength="255" required
                                    autocomplete="name"></label>
                            <label>Email<input name="email" type="email" maxlength="255" required
                                    autocomplete="email"></label>
                            <label>Password<input name="password" type="password" minlength="14" maxlength="72" required
                                    autocomplete="new-password"></label>
                            <label>Konfirmasi password<input name="password_confirmation" type="password" minlength="14"
                                    maxlength="72" required autocomplete="new-password"></label>
                        </div>
                        <label class="au-check"><input type="checkbox" name="confirm_new_identity" value="1"
                                required> Saya berwenang membuat akun baru pada database bersama.</label>
                    </div>
                    <div id="auExistingIdentity" class="au-note" hidden>
                        <strong id="auExistingName"></strong>
                        <span id="auExistingEmail"></span>
                        <small>Nama, email, password dan role aplikasi legacy tidak diubah.</small>
                    </div>
                    <fieldset class="au-fieldset">
                        <legend>Role pengguna</legend>
                        <div class="au-role-options">
                            @foreach (['master' => 'Master', 'user' => 'User', 'viewer' => 'Viewer'] as $key => $label)
                                <label><input type="radio" name="role" value="{{ $key }}" required>
                                    {{ $label }}</label>
                            @endforeach
                        </div>
                    </fieldset>
                    <p class="au-note" id="auRoleHint"></p>
                    <fieldset class="au-fieldset" id="auModules">
                        <legend>Penugasan K.I.B / K.I.R</legend>
                        <div class="au-module-grid">
                            @foreach ($modules as $key => $module)
                                <label class="au-module">
                                    <input type="checkbox" name="modules[]" value="{{ $key }}"
                                        data-code="{{ $module['code'] }}">
                                    <span><strong>{{ $module['code'] }}</strong><small>{{ $module['label'] }}</small></span>
                                </label>
                            @endforeach
                        </div>
                    </fieldset>
                    <label>Status akses Sistem Aset
                        <select name="is_active" required>
                            <option value="1">Aktif</option>
                            <option value="0">Nonaktif</option>
                        </select>
                    </label>
                    <div class="au-preview" aria-live="polite">
                        <small>Preview label role</small>
                        <strong id="auPreview">User</strong>
                    </div>
                </div>
                <footer class="au-dialog-footer">
                    <button type="button" class="au-button au-secondary" data-close-dialog>Batal</button>
                    <button type="submit" class="au-button au-primary" id="auSave"><i data-lucide="save"></i>
                        Simpan</button>
                </footer>
            </form>
        </dialog>
    </section>
@endsection

@push('scripts')
    <script src="{{ asset('js/pages/master/user.js') }}?v={{ filemtime(public_path('js/pages/master/user.js')) }}">
    </script>
@endpush
