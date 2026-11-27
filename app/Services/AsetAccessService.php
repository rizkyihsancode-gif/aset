<?php

namespace App\Services;

use App\Models\AsetUserAccess;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AsetAccessService
{
    public function enabled(): bool
    {
        return (bool) config('aset_access.enabled', false);
    }

    public function profile(?Authenticatable $user): array
    {
        if (! $user) {
            return ['role' => null, 'active' => false, 'modules' => []];
        }

        if (! $this->enabled()) {
            $email = strtolower(trim((string) config('aset_admin.email')));
            $active = filter_var($email, FILTER_VALIDATE_EMAIL) !== false && $user->email === $email;

            return ['role' => $active ? 'master' : null, 'active' => $active, 'modules' => []];
        }

        return $this->fromRecord(AsetUserAccess::query()->find($user->getAuthIdentifier()));
    }

    public function fromRecord(?AsetUserAccess $record): array
    {
        $role = $record?->role;
        $stored = $record?->modules;
        $stored = is_array($stored) ? array_filter($stored, 'is_string') : [];
        $modules = array_values(array_intersect(array_keys(config('aset_access.modules', [])), $stored));
        $active = (bool) $record?->is_active
            && in_array($role, ['master', 'user', 'viewer'], true)
            && ($role !== 'user' || count($modules) > 0);

        return ['role' => $role, 'active' => $active, 'modules' => $role === 'user' ? $modules : []];
    }

    public function can(array $profile, string $module): bool
    {
        if (! ($profile['active'] ?? false)) {
            return false;
        }

        if ($profile['role'] === 'master' || $module === 'dashboard') {
            return true;
        }

        return $profile['role'] === 'user' && in_array($module, $profile['modules'], true);
    }

    public function label(array $profile): string
    {
        if ($profile['role'] === 'master') {
            return 'Master';
        }

        if ($profile['role'] === 'viewer') {
            return 'Viewer';
        }

        if ($profile['role'] === 'user') {
            $codes = array_map(fn(string $key): string => config("aset_access.modules.{$key}.code"), $profile['modules']);

            return 'User (' . ($codes ? implode(', ', $codes) : 'Belum ditugaskan') . ')';
        }

        return 'Belum diatur';
    }

    /**
     * Klasifikasi route menggunakan URI terdaftar, bukan input query/body.
     * Endpoint tanpa klasifikasi hanya untuk Master. PDF dan voucher bersama
     * memiliki pemeriksaan kategori sendiri.
     */
    public function allowsRequest(array $profile, Request $request): bool
    {
        if (! ($profile['active'] ?? false)) {
            return false;
        }

        if ($profile['role'] === 'master') {
            return true;
        }

        $route = $request->route();
        $uri = $route?->uri() ?? '';
        $name = $route?->getName() ?? '';

        if ($uri === 'dashboard' && $name === 'dashboard' && $request->isMethodSafe() && in_array($request->method(), ['GET', 'HEAD'], true)) {
            return true;
        }

        if ($profile['role'] !== 'user') {
            return false;
        }

        // KIB D displays the same physical Gedung records as KIB C.
        // Permit only this existing read endpoint; do not permit C CRUD.
        if (
            $name === 'kib.gedung.file'
            && $uri === 'kib/gedung/{gedung}/file/{jenis}'
            && in_array($request->method(), ['GET', 'HEAD'], true)
        ) {
            return $this->can($profile, 'gedung') || $this->can($profile, 'jalan');
        }

        if (
            $name === 'kib.pending' && $uri === 'kib/pending/{module}'
            && in_array($request->method(), ['GET', 'HEAD'], true)
        ) {
            $module = (string) $route->parameter('module');

            $module = $module === 'aset_tetap' ? 'aset_ttp' : $module;

            return array_key_exists($module, config('aset_access.modules', [])) && $this->can($profile, $module);
        }

        $voucherRoutes = [
            'kib.voucher.riwayat' => ['kib/voucher/{kategori}', ['GET', 'HEAD']],
            'kib.voucher.hubungkan' => ['kib/voucher/{kategori}/hubungkan', ['POST']],
            'kib.voucher.lepaskan' => ['kib/voucher/{kategori}/lepaskan', ['POST']],
        ];

        if (
            isset($voucherRoutes[$name])
            && $uri === $voucherRoutes[$name][0]
            && in_array($request->method(), $voucherRoutes[$name][1], true)
        ) {
            return match ($route->parameter('kategori')) {
                'gedung' => $this->can($profile, 'gedung') || $this->can($profile, 'jalan'),
                'jembatan' => $this->can($profile, 'jalan'),
                'aset_ttp' => $this->can($profile, 'aset_ttp'),
                'konstruksi' => $this->can($profile, 'konstruksi'),
                'kir' => $this->can($profile, 'kir'),
                default => false,
            };
        }

        $voucherFileRoutes = [
            'nilai.pdf.preview' => 'nilai/{nilai}/pdf',
            'nilai.pdf.download' => 'nilai/{nilai}/pdf/download',
            'nilai.dokumen.preview' => 'nilai/{nilai}/dokumen/{dokumen}/preview',
            'nilai.dokumen.download' => 'nilai/{nilai}/dokumen/{dokumen}/download',
        ];

        if (
            isset($voucherFileRoutes[$name])
            && $uri === $voucherFileRoutes[$name]
            && in_array($request->method(), ['GET', 'HEAD'], true)
        ) {
            return $this->allowsVoucherFile($profile, (int) $route->parameter('nilai'));
        }

        foreach (array_keys(config('aset_access.modules', [])) as $module) {
            $prefix = 'kib/' . $module;
            $routeName = 'kib.' . $module;

            if (($uri === $prefix || str_starts_with($uri, $prefix . '/'))
                && ($name === $routeName || str_starts_with($name, $routeName . '.'))
            ) {
                return $this->can($profile, $module);
            }
        }

        // Alias redirect lama untuk KIB E.
        return $uri === 'kib/aset-tetap' && $request->isMethodSafe() && in_array($request->method(), ['GET', 'HEAD'], true) && $this->can($profile, 'aset_ttp');
    }

    /** PDF Nilai Aset boleh dibuka hanya untuk kategori yang terkonfirmasi. */
    protected function allowsVoucherFile(array $profile, int $id): bool
    {
        if ($id < 1) {
            return false;
        }

        $row = DB::table('nilai_aktivas as n')
            ->leftJoin('golongans as g', 'g.id', '=', 'n.cat')
            ->leftJoin('aktivas as a', 'a.id', '=', 'n.id_aktiva')
            ->where('n.id', $id)
            ->first(['g.nama as golongan', 'a.kib as kib', 'a.kode as kode']);

        if (! $row) {
            return false;
        }

        $normalize = static fn(mixed $value): string => strtoupper(trim(preg_replace('/[^A-Za-z0-9]+/', ' ', (string) $value) ?? ''));
        $matched = [];
        foreach (config('kib.modules', []) as $key => $definition) {
            $aliases = array_map($normalize, $definition['aliases'] ?? []);
            $module = $key === 'aset_tetap' ? 'aset_ttp' : $key;
            if ($key === 'gedung') {
                $aliases[] = 'GEDUNG BANGUNAN';
            }
            if ($key === 'kir') {
                $aliases[] = 'K I R';
            }
            foreach ([$row->golongan, $row->kib] as $value) {
                if ($normalize($value) !== '' && in_array($normalize($value), $aliases, true)) {
                    $matched[] = $module;
                }
            }
        }

        if (preg_match('/^31\.08(?:\.|$)/', trim((string) $row->kode))) {
            $matched[] = 'mesin';
        }

        $matched = array_values(array_unique($matched));
        if (count($matched) !== 1) {
            // Kategori ambigu tidak boleh dibuka operator; Master tetap bisa meninjau.
            return false;
        }

        return $this->can($profile, $matched[0])
            || ($matched[0] === 'gedung' && $this->can($profile, 'jalan'));
    }
}
