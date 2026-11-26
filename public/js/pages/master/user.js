(() => {
    'use strict';

    const root = document.getElementById('asetUserPage');

    if (!root) {
        return;
    }

    const find = (selector) => root.querySelector(selector);
    const rows = Array.from(root.querySelectorAll('[data-user-row]'));
    const search = find('#auSearch');
    const roleFilter = find('#auRoleFilter');
    const statusFilter = find('#auStatusFilter');
    const pageSize = find('#auPageSize');
    const previous = find('#auPrev');
    const next = find('#auNext');
    let page = 1;

    // FILTER DAN PAGINATION LOKAL (21 akun legacy).
    function renderRows() {
        const term = search.value.trim().toLocaleLowerCase('id');
        const matching = rows.filter((row) => {
            return row.dataset.search.toLocaleLowerCase('id').includes(term)
                && (!roleFilter.value || row.dataset.role === roleFilter.value)
                && (!statusFilter.value || row.dataset.status === statusFilter.value);
        });

        const size = Number(pageSize.value);
        const lastPage = Math.max(1, Math.ceil(matching.length / size));
        page = Math.min(Math.max(1, page), lastPage);
        const start = (page - 1) * size;
        const visible = matching.slice(start, start + size);
        const shown = new Set(visible);

        rows.forEach((row) => {
            row.hidden = !shown.has(row);
        });

        visible.forEach((row, index) => {
            row.querySelector('[data-row-number]').textContent = String(start + index + 1);
        });

        find('#auCount').textContent = `${matching.length} akun`;
        find('#auEmpty').hidden = matching.length > 0;
        find('#auPageInfo').textContent = matching.length
            ? `Menampilkan ${start + 1}–${start + visible.length} dari ${matching.length} akun`
            : 'Menampilkan 0 akun';

        previous.disabled = page <= 1;
        next.disabled = page >= lastPage;
    }

    [search, roleFilter, statusFilter, pageSize].forEach((control) => {
        control.addEventListener(control === search ? 'input' : 'change', () => {
            page = 1;
            renderRows();
        });
    });

    find('#auReset').addEventListener('click', () => {
        search.value = '';
        roleFilter.value = '';
        statusFilter.value = '';
        page = 1;
        renderRows();
    });

    previous.addEventListener('click', () => {
        page -= 1;
        renderRows();
    });

    next.addEventListener('click', () => {
        page += 1;
        renderRows();
    });

    // FORM TAMBAH / EDIT AKSES.
    const dialog = find('#auDialog');
    const form = find('#auForm');
    const method = find('#auMethod');
    const newIdentity = find('#auNewIdentity');
    const existingIdentity = find('#auExistingIdentity');
    const moduleFieldset = find('#auModules');
    const moduleInputs = Array.from(form.querySelectorAll('[name="modules[]"]'));
    const roleInputs = Array.from(form.querySelectorAll('[name="role"]'));
    const status = form.elements.namedItem('is_active');
    const save = find('#auSave');
    let trigger = null;

    function selectedRole() {
        return roleInputs.find((input) => input.checked)?.value || 'user';
    }

    function syncRole() {
        const role = selectedRole();
        const selected = moduleInputs.filter((input) => input.checked);
        const isUser = role === 'user';

        moduleFieldset.hidden = !isUser;
        moduleFieldset.disabled = !isUser;
        find('#auRoleHint').textContent = role === 'master'
            ? 'Master dapat membuka dan mengelola seluruh menu.'
            : role === 'viewer'
                ? 'Viewer hanya dapat melihat Dashboard.'
                : 'Pilih minimal satu K.I.B atau K.I.R. Dashboard selalu tersedia.';

        find('#auPreview').textContent = role === 'master'
            ? 'Master'
            : role === 'viewer'
                ? 'Viewer'
                : `User (${selected.map((input) => input.dataset.code).join(', ') || 'Belum ditugaskan'})`;

        save.disabled = isUser && selected.length === 0;
    }

    function openDialog(button, user = null) {
        trigger = button;
        form.reset();
        const editing = user !== null;
        form.action = editing ? button.dataset.url : root.dataset.storeUrl;
        method.disabled = !editing;
        newIdentity.hidden = editing;
        existingIdentity.hidden = !editing;

        newIdentity.querySelectorAll('input').forEach((input) => {
            input.disabled = editing;
        });

        find('#auDialogTitle').textContent = editing ? 'Edit Akses User' : 'Tambah User';
        find('#auExistingName').textContent = user?.name || '';
        find('#auExistingEmail').textContent = user?.email || '';

        roleInputs.forEach((input) => {
            input.checked = input.value === (user?.role || 'user');
        });
        moduleInputs.forEach((input) => {
            input.checked = user?.modules?.includes(input.value) || false;
        });
        status.value = user && user.role ? (user.active ? '1' : '0') : '1';
        syncRole();
        dialog.showModal();
    }

    find('#auAdd').addEventListener('click', (event) => {
        openDialog(event.currentTarget);
    });

    root.querySelectorAll('[data-edit-user]').forEach((button) => {
        button.addEventListener('click', () => {
            openDialog(button, JSON.parse(button.dataset.user));
        });
    });

    [...roleInputs, ...moduleInputs].forEach((input) => {
        input.addEventListener('change', syncRole);
    });

    root.querySelectorAll('[data-close-dialog]').forEach((button) => {
        button.addEventListener('click', () => dialog.close());
    });

    dialog.addEventListener('close', () => {
        form.reset();
        trigger?.focus();
    });

    form.addEventListener('submit', (event) => {
        if (selectedRole() === 'user' && !moduleInputs.some((input) => input.checked)) {
            event.preventDefault();
        }
    });

    renderRows();
    syncRole();
})();