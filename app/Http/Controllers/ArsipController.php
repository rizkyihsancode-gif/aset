<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class ArsipController extends Controller
{
    private function today(): CarbonImmutable
    {
        return CarbonImmutable::today('Asia/Makassar');
    }

    private function query()
    {
        return DB::table('arsips as a')->leftJoin(
            'indeks as i',
            'i.id',
            '=',
            'a.id_indeks'
        )->select(
            'a.id',
            'a.id_indeks',
            'a.reg',
            'a.kondisi',
            'a.rekanan',
            'a.judul',
            'a.nilai',
            'a.retensi',
            'a.ket',
            'a.retensi_akhir',
            'a.file_path',
            'a.file_name',
            'a.updated_at',
            'i.gedung',
            'i.fill',
            'i.rak',
            'i.no_file',
            'i.nama_dok',
            'i.kode_dok',
            'i.bulan',
            'i.tahun',
            'i.id_departemen',
            'i.id_div'
        );
    }

    private function filters(Request $request): array
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->query(), [
            'q' => 'nullable|string|max:200',
            'gedung' => 'nullable|integer|min:0|max:2147483647',
            'fill' => 'nullable|integer|min:0|max:2147483647',
            'rak' => 'nullable|string|max:255',
            'tahun' => 'nullable|integer|min:0|max:2147483647',
            'kondisi' => 'nullable|string|max:255',
            'index_id' => 'nullable|integer|min:1|max:2147483647',
            'retensi_status' => 'nullable|in:near,expired,unknown,active',
            'per_page' => 'nullable|in:10,25,50,100',
        ]);
        if ($validator->fails()) {
            throw (new ValidationException($validator))->redirectTo(route('main.arsip'));
        }
        return $validator->validated();
    }

    private function filtered(array $f)
    {
        $q = $this->query();
        if (isset($f['q']) && trim($f['q']) !== '') {
            // Escape LIKE metacharacters; bindings prevent SQL injection.
            $term = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], trim($f['q'])) . '%';
            $q->where(function ($sub) use ($term) {
                foreach (
                    [
                        'a.judul',
                        'a.reg',
                        'a.rekanan',
                        'a.ket',
                        'i.nama_dok',
                    ] as $col
                ) {
                    $sub->orWhere($col, 'ilike', $term);
                }
                $sub->orWhereRaw('CAST(i.kode_dok AS text) ILIKE ?', [$term]);
            });
        }
        foreach (['gedung', 'fill', 'tahun'] as $key) {
            if (isset($f[$key])) {
                $q->where('i.' . $key, $f[$key]);
            }
        }
        if (isset($f['rak'])) {
            $q->whereRaw('BTRIM(i.rak) = ?', [trim($f['rak'])]);
        }
        if (isset($f['kondisi'])) {
            $q->whereRaw('BTRIM(a.kondisi) = ?', [trim($f['kondisi'])]);
        }
        if (isset($f['index_id'])) {
            $q->where('i.id', $f['index_id']);
        }
        $today = $this->today();
        $end = $today->addDays(90)->toDateString();
        match ($f['retensi_status'] ?? null) {
            'near' => $q->whereBetween('a.retensi_akhir', [$today->toDateString(), $end]),
            'expired' => $q->where('a.retensi_akhir', '<', $today->toDateString()),
            'unknown' => $q->whereNull('a.retensi_akhir'),
            'active' => $q->where('a.retensi_akhir', '>', $end),
            default => null,
        };
        return $q->orderByDesc('a.id');
    }

    private function clean(mixed $v): ?string
    {
        return $v === null || trim((string) $v) === '' ? null : trim((string) $v);
    }

    private function retention(?string $date): array
    {
        if (!$date) {
            return ['key' => 'unknown', 'label' => 'Tanggal belum diatur', 'remaining' => '—'];
        }
        $end = CarbonImmutable::parse($date, 'Asia/Makassar')->startOfDay();
        $days = (int) $this->today()->diffInDays($end, false);
        return ['key' => $days < 0 ? 'expired' : ($days <= 90 ? 'near' : 'active'), 'label' => $days < 0 ? 'Retensi berakhir' : ($days <= 90 ? 'Mendekati retensi' : 'Dalam retensi'), 'remaining' => $days < 0 ? abs($days) . ' hari lewat' : ($days === 0 ? 'Hari ini' : $days . ' hari')];
    }

    private function row(array|\stdClass $row): array
    {
        $r = (array) $row;
        foreach (
            [
                'reg',
                'kondisi',
                'rekanan',
                'judul',
                'retensi',
                'ket',
                'rak',
                'nama_dok',
                'file_name',
            ] as $key
        ) {
            $r[$key] = $this->clean($r[$key]);
        }
        $r['nilai'] = $r['nilai'] === null ? null : (string) $r['nilai'];
        $r['retention'] = $this->retention($r['retensi_akhir']);
        $r['has_file'] = $this->validPath($r['file_path']) && Storage::disk('local')->exists($r['file_path']);
        unset($r['file_path']);
        $r['edit_url'] = route('arsip.update', ['arsip' => $r['id']]);
        $r['view_url'] = route('arsip.file', ['arsip' => $r['id']]);
        $r['download_url'] = route('arsip.file', ['arsip' => $r['id'], 'download' => 1]);
        return $r;
    }

    public function index(Request $request)
    {
        $filters = $this->filters($request);
        $rows = $this->filtered($filters)->paginate((int) ($filters['per_page'] ?? 10))->withQueryString();
        $rows->through(fn($row) => $this->row($row));
        $indices = DB::table('indeks')->select(
            'id',
            'gedung',
            'fill',
            'rak',
            'no_file',
            'nama_dok',
            'kode_dok',
            'tahun',
            'bulan'
        )->orderBy('gedung')->orderBy('fill')->orderBy('rak')->orderBy('no_file')->orderBy('id')->get()->map(function ($i) {
            $i->rak = $this->clean($i->rak);
            $i->nama_dok = $this->clean($i->nama_dok);
            return $i;
        });
        $today = $this->today();
        $stats = [
            'total' => DB::table('arsips')->count(),
            'buildings' => DB::table('indeks')->whereNotNull('gedung')->distinct()->count('gedung'),
            'fillings' => DB::table('indeks')->whereNotNull('gedung')->whereNotNull('fill')->select('gedung', 'fill')->distinct()->get()->count(),
            'racks' => DB::table('indeks')->whereNotNull('gedung')->whereNotNull('fill')->whereNotNull('rak')->whereRaw("BTRIM(rak) <> ''")->select('gedung', 'fill')->selectRaw('BTRIM(rak) AS rak')->distinct()->get()->count(),
            'near' => DB::table('arsips')->whereBetween('retensi_akhir', [$today->toDateString(), $today->addDays(90)->toDateString()])->count(),
            'expired' => DB::table('arsips')->where('retensi_akhir', '<', $today->toDateString())->count(),
        ];
        $conditions = DB::table('arsips')->whereNotNull('kondisi')->selectRaw('DISTINCT BTRIM(kondisi) AS kondisi')->orderBy('kondisi')->pluck('kondisi')->filter(fn($v) => $v !== '');
        $departments = DB::table('departemens')->select('id', 'nama_dep')->orderBy('nama_dep')->get();
        $divisions = DB::table('divisis')->select('id', 'id_dep', 'nama_div')->orderBy('nama_div')->get();
        return view('main.arsip', compact(
            'rows',
            'indices',
            'stats',
            'filters',
            'conditions',
            'departments',
            'divisions'
        ));
    }

    public function store(Request $request)
    {
        return $this->save($request, null);
    }

    public function update(Request $request, int $arsip)
    {
        return $this->save($request, $arsip);
    }

    private function save(Request $request, ?int $id)
    {
        $newIndex = $request->input('index_mode') === 'new';
        $rules = [
            'judul' => 'required|string|max:2000',
            'reg' => 'nullable|string|max:255',
            'kondisi' => 'nullable|string|max:255',
            'rekanan' => 'nullable|string|max:255',
            'nilai' => 'nullable|integer|between:-9223372036854775807,9223372036854775807',
            'retensi' => 'nullable|string|max:255',
            'retensi_akhir' => 'nullable|date_format:Y-m-d',
            'ket' => 'nullable|string|max:10000',
            'pdf' => 'nullable|file|mimes:pdf|mimetypes:application/pdf|max:20480',
            'index_mode' => 'required|in:existing,new',
        ];
        if ($newIndex) {
            $rules += [
                'gedung' => 'required|integer|min:1|max:2147483647',
                'fill' => 'required|integer|min:1|max:2147483647',
                'rak' => 'required|string|max:255',
                'no_file' => 'required|integer|min:1|max:2147483647',
                'nama_dok' => 'required|string|max:255',
                'kode_dok' => 'nullable|integer|min:0|max:2147483647',
                'bulan' => 'nullable|integer|between:1,12',
                'tahun' => 'nullable|integer|between:1900,2200',
                'id_departemen' => ['nullable', 'integer', Rule::exists('departemens', 'id')],
                'id_div' => ['nullable', 'integer', Rule::exists('divisis', 'id')->where('id_dep', $request->integer('id_departemen'))],
                'index_ket' => 'nullable|string|max:10000',
            ];
        } else {
            $rules['id_indeks'] = [
                'required',
                'integer',
                'min:1',
                'max:2147483647',
                Rule::exists('indeks', 'id'),
            ];
        }
        $data = $request->validate($rules);
        if ($id !== null && !DB::table('arsips')->where('id', $id)->exists()) {
            abort(404);
        }
        $disk = Storage::disk('local');
        $path = null;
        try {
            if ($request->hasFile('pdf')) {
                $path = $request->file('pdf')->store('arsip/dokumen', 'local');
                if (!$path || !$this->validPath($path)) {
                    throw new \RuntimeException('Penyimpanan PDF gagal.');
                }
            }
            DB::transaction(function () use ($id, $data, $newIndex, $path, $request) {
                if ($id !== null) {
                    $old = DB::table('arsips')->where('id', $id)->lockForUpdate()->first();
                    abort_unless($old, 404);
                }
                $now = now();
                if ($newIndex) {
                    // New index is intentional; never edit a shared legacy index in place.
                    $index = array_intersect_key($data, array_flip([
                        'gedung',
                        'fill',
                        'rak',
                        'no_file',
                        'nama_dok',
                        'kode_dok',
                        'bulan',
                        'tahun',
                        'id_departemen',
                        'id_div',
                    ]));
                    $index['ket'] = $data['index_ket'] ?? null;
                    $index['created_at'] = $index['updated_at'] = $now;
                    $indexId = DB::table('indeks')->insertGetId($index);
                    if ($indexId > 2147483647) {
                        throw ValidationException::withMessages(['id_indeks' => 'ID indeks melebihi kapasitas kolom legacy.']);
                    }
                } else {
                    $indexId = $data['id_indeks'];
                    if (!DB::table('indeks')->where('id', $indexId)->lockForUpdate()->first()) {
                        throw ValidationException::withMessages(['id_indeks' => 'Indeks sudah tidak tersedia.']);
                    }
                }
                $values = array_intersect_key($data, array_flip([
                    'judul',
                    'reg',
                    'kondisi',
                    'rekanan',
                    'nilai',
                    'retensi',
                    'retensi_akhir',
                    'ket',
                ]));
                $values['id_indeks'] = $indexId;
                $values['updated_at'] = $now;
                if ($path) {
                    $values['file_path'] = $path;
                    $values['file_name'] = mb_substr($request->file('pdf')->getClientOriginalName(), 0, 255);
                }
                if ($id === null) {
                    $values['created_at'] = $now;
                    DB::table('arsips')->insert($values);
                } else {
                    DB::table('arsips')->where('id', $id)->update($values);
                }
            }, 3);
        } catch (Throwable $e) {
            // Old file is intentionally retained; only the new uncommitted file is removed.
            if ($path && $this->validPath($path)) {
                $disk->delete($path);
            }
            throw $e;
        }
        return redirect()->route('main.arsip')->with('arsip_success', $id === null ? 'Arsip berhasil ditambahkan.' : 'Arsip berhasil diperbarui.');
    }

    private function validPath(mixed $path): bool
    {
        return is_string($path) && preg_match('~\Aarsip/dokumen/[A-Za-z0-9]{40}\.pdf\z~D', $path) === 1;
    }

    public function file(Request $request, int $arsip)
    {
        $row = DB::table('arsips')->where('id', $arsip)->first(['file_path']);
        abort_unless($row && $this->validPath($row->file_path), 404);
        $disk = Storage::disk('local');
        abort_unless($disk->exists($row->file_path), 404);
        $headers = ['Content-Type' => 'application/pdf', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store'];
        $name = 'arsip-' . $arsip . '.pdf';
        if ($request->boolean('download')) {
            return response()->download($disk->path($row->file_path), $name, $headers);
        }
        return response()->file($disk->path($row->file_path), $headers + ['Content-Disposition' => 'inline; filename="' . $name . '"']);
    }

    private function csvText(mixed $v): string
    {
        $v = (string) ($v ?? '');
        // Guard spreadsheet formula injection, including whitespace-prefixed cells.
        return preg_match('/^\s*[=+@-]|^[\t\r\n]/u', $v) ? "'" . $v : $v;
    }

    public function export(Request $request)
    {
        $filters = $this->filters($request);
        return response()->streamDownload(function () use ($filters) {
            $fp = fopen('php://output', 'w');
            fwrite($fp, "﻿");
            fputcsv(
                $fp,
                [
                    'ID Arsip',
                    'Kode Dokumen',
                    'Register',
                    'Judul',
                    'Gedung',
                    'Filling',
                    'Rak',
                    'Baris',
                    'Tahun',
                    'Kondisi',
                    'Rekanan',
                    'Nilai Rp',
                    'Retensi',
                    'Tanggal Akhir Retensi',
                    'Keterangan',
                ],
                ';',
                '"',
                ''
            );
            foreach ($this->filtered($filters)->cursor() as $r) {
                $cells = [
                    $r->id,
                    $r->kode_dok,
                    $r->reg,
                    $r->judul,
                    $r->gedung,
                    $r->fill,
                    $r->rak,
                    $r->no_file,
                    $r->tahun,
                    $r->kondisi,
                    $r->rekanan,
                    $r->nilai,
                    $r->retensi,
                    $r->retensi_akhir,
                    $r->ket,
                ];
                $safe = array_map(fn($v) => $this->csvText($v), $cells);
                $safe[11] = (string) ($r->nilai ?? '');
                // trusted bigint, not user-controlled formula text
                fputcsv(
                    $fp,
                    $safe,
                    ';',
                    '"',
                    ''
                );
            }
            fclose($fp);
        }, 'arsip-aset-' . now()->format('Ymd') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'private, no-store']);
    }
}
