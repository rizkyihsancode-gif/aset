<?php

namespace App\Http\Controllers;

use App\Models\NilaiAktiva;
use App\Services\KibNotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class NilaiAsetController extends Controller
{
    /**
     * Daftar Nilai Aset, filter, pagination,
     * master dropdown, dan grafik.
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 20);

        if (!in_array($perPage, [10, 20, 50, 100], true)) {
            $perPage = 20;
        }

        $query = DB::table('nilai_aktivas as n')
            ->leftJoin('aktivas as a', 'a.id', '=', 'n.id_aktiva')
            ->leftJoin('lokasis as l', 'l.id', '=', 'n.id_lokasi')
            ->leftJoin('departemens as d', 'd.id', '=', 'n.dep')
            ->leftJoin('divisis as dv', 'dv.id', '=', 'n.div')
            ->leftJoin('golongans as g', 'g.id', '=', 'n.cat')
            ->select([
                'n.*',
                'a.kode as aktiva_kode',
                'a.aktiva as aktiva_nama',
                'a.kib as aktiva_kib',
                'l.lokasi as lokasi_nama',
                DB::raw('TRIM(d.nama_dep) as departemen_nama'),
                DB::raw('TRIM(d.kode_dep) as departemen_kode'),
                DB::raw('TRIM(dv.nama_div) as divisi_nama'),
                DB::raw('TRIM(g.nama) as golongan_nama'),
            ]);

        $search = trim((string) $request->get('search', ''));

        if ($search !== '') {
            $needle = '%' . mb_strtolower($search) . '%';

            $query->where(function ($q) use ($needle) {
                foreach (
                    [
                        'n.no_voucher',
                        'n.urai',
                        'a.kode',
                        'a.aktiva',
                        'a.kib',
                        'l.lokasi',
                        'd.nama_dep',
                        'd.kode_dep',
                        'dv.nama_div',
                        'g.nama',
                    ] as $column
                ) {
                    $q->orWhereRaw(
                        "LOWER(COALESCE({$column}, '')) LIKE ?",
                        [$needle]
                    );
                }
            });
        }

        if ($request->filled('tahun')) {
            $query->where(
                'n.tahun',
                (string) $request->tahun
            );
        }

        if ($request->filled('lokasi')) {
            $query->where(
                'n.id_lokasi',
                (int) $request->lokasi
            );
        }

        if ($request->filled('cat')) {
            $query->where(
                'n.cat',
                (int) $request->cat
            );
        }

        if ($request->filled('dep')) {
            $query->where(
                'n.dep',
                (int) $request->dep
            );
        }

        if ($request->filled('div')) {
            $query->where(
                'n.div',
                (int) $request->div
            );
        }

        $nilaiAsets = $query
            ->orderByDesc('n.tgl_voucher')
            ->orderByDesc('n.id')
            ->paginate($perPage)
            ->withQueryString();

        // MASTER AKTIVA
        $aktivaOptions = DB::table('aktivas')
            ->select(['id', 'kode', 'aktiva', 'kib'])
            ->orderBy('kode')
            ->orderBy('aktiva')
            ->get();

        // MASTER LOKASI
        $lokasiOptions = DB::table('lokasis')
            ->select(['id', 'lokasi'])
            ->orderBy('lokasi')
            ->get();

        // MASTER DEPARTEMEN
        $departemenOptions = DB::table('departemens')
            ->select('id')
            ->selectRaw('TRIM(nama_dep) as nama_dep')
            ->selectRaw('TRIM(kode_dep) as kode_dep')
            ->orderByRaw('TRIM(nama_dep) ASC')
            ->get();

        // MASTER DIVISI
        $divisiOptions = DB::table('divisis')
            ->select(['id', 'id_dep'])
            ->selectRaw('TRIM(nama_div) as nama_div')
            ->orderByRaw('TRIM(nama_div) ASC')
            ->get();

        // MASTER GOLONGAN
        $golonganOptions = DB::table('golongans')
            ->select('id')
            ->selectRaw('TRIM(nama) as nama')
            ->orderBy('id')
            ->get();

        // JENIS TRANSAKSI
        $jenisOptions = collect([
            [
                'id' => 1,
                'nama' => 'Penambahan Aset',
            ],
            [
                'id' => 2,
                'nama' => 'Penambahan Nilai',
            ],
        ]);

        // TAHUN
        $currentYear = (int) now('Asia/Makassar')->format('Y');

        $tahunOptions = collect(
            range($currentYear + 10, $currentYear - 50)
        );

        // KPI NILAI ASET
        $totalNilai = (int) DB::table('nilai_aktivas')
            ->sum('nilai');

        $totalTransaksi = DB::table('nilai_aktivas')
            ->count();

        $penambahanTahunIni = (int) DB::table('nilai_aktivas')
            ->where('tahun', (string) $currentYear)
            ->sum('nilai');

        $previousYear = $currentYear - 1;

        $penambahanTahunLalu = (int) DB::table('nilai_aktivas')
            ->where('tahun', (string) $previousYear)
            ->sum('nilai');

        $deltaTahun = $penambahanTahunLalu > 0
            ? (
                ($penambahanTahunIni - $penambahanTahunLalu)
                / $penambahanTahunLalu
            ) * 100
            : null;

        $tahunAktif = DB::table('nilai_aktivas')
            ->whereRaw("tahun ~ '^[0-9]{4}$'")
            ->selectRaw(
                'MAX(tahun::integer) AS tahun_aktif'
            )
            ->value('tahun_aktif');

        $stats = [
            'total_nilai' => $totalNilai,
            'total_transaksi' => $totalTransaksi,
            'penambahan_tahun_ini' => $penambahanTahunIni,
            'penambahan_tahun_lalu' => $penambahanTahunLalu,
            'delta_tahun' => $deltaTahun,
            'tahun_aktif' => $tahunAktif ?: $currentYear,
        ];

        // TREND NILAI ASET
        $trendYears = collect(
            range($currentYear - 4, $currentYear)
        );

        $trendRaw = DB::table('nilai_aktivas')
            ->selectRaw(
                'tahun, SUM(COALESCE(nilai, 0)) AS total'
            )
            ->whereIn(
                'tahun',
                $trendYears
                    ->map(fn($tahun) => (string) $tahun)
                    ->all()
            )
            ->groupBy('tahun')
            ->pluck('total', 'tahun');

        $trendLabels = [];
        $trendValues = [];

        foreach ($trendYears as $tahun) {
            $trendLabels[] = (string) $tahun;

            $trendValues[] = (int) (
                $trendRaw[(string) $tahun] ?? 0
            );
        }

        // DISTRIBUSI GOLONGAN
        $distribution = DB::table('nilai_aktivas as n')
            ->leftJoin(
                'golongans as g',
                'g.id',
                '=',
                'n.cat'
            )
            ->selectRaw(
                "COALESCE(TRIM(g.nama), 'Tanpa Golongan') AS nama,
                 SUM(COALESCE(n.nilai, 0)) AS total"
            )
            ->groupBy('g.id', 'g.nama')
            ->orderBy('g.id')
            ->get();

        $categoryLabels = $distribution
            ->pluck('nama')
            ->values()
            ->all();

        $categoryValues = $distribution
            ->pluck('total')
            ->map(fn($value) => (int) $value)
            ->values()
            ->all();

        return view('main.nilai', compact(
            'nilaiAsets',
            'aktivaOptions',
            'lokasiOptions',
            'departemenOptions',
            'divisiOptions',
            'golonganOptions',
            'jenisOptions',
            'tahunOptions',
            'currentYear',
            'stats',
            'trendLabels',
            'trendValues',
            'categoryLabels',
            'categoryValues'
        ));
    }

    /**
     * DETAIL NILAI ASET
     */
    public function show(int $nilai)
    {
        $data = DB::table('nilai_aktivas as n')
            ->leftJoin('aktivas as a', 'a.id', '=', 'n.id_aktiva')
            ->leftJoin('lokasis as l', 'l.id', '=', 'n.id_lokasi')
            ->leftJoin('departemens as d', 'd.id', '=', 'n.dep')
            ->leftJoin('divisis as dv', 'dv.id', '=', 'n.div')
            ->leftJoin('golongans as g', 'g.id', '=', 'n.cat')
            ->where('n.id', $nilai)
            ->select([
                'n.*',
                'a.kode as aktiva_kode',
                'a.aktiva as aktiva_nama',
                'a.kib as aktiva_kib',
                'l.lokasi as lokasi_nama',
                DB::raw('TRIM(d.nama_dep) as departemen_nama'),
                DB::raw('TRIM(d.kode_dep) as departemen_kode'),
                DB::raw('TRIM(dv.nama_div) as divisi_nama'),
                DB::raw('TRIM(g.nama) as golongan_nama'),
            ])
            ->first();

        abort_if(!$data, 404);

        return response()->json([
            'success' => true,

            'data' => [
                'id' => $data->id,
                'no_voucher' => $data->no_voucher,
                'tgl_voucher' => $data->tgl_voucher,

                'id_aktiva' => $data->id_aktiva,
                'aktiva_kode' => $data->aktiva_kode,
                'aktiva_nama' => $data->aktiva_nama,
                'aktiva_kib' => $data->aktiva_kib,

                'nilai' => $data->nilai,
                'urai' => $data->urai,
                'tahun' => $data->tahun,

                'id_lokasi' => $data->id_lokasi,
                'lokasi_nama' => $data->lokasi_nama,

                'dep' => $data->dep,
                'departemen_nama' => $data->departemen_nama,
                'departemen_kode' => $data->departemen_kode,

                'div' => $data->div,
                'divisi_nama' => $data->divisi_nama,

                'cat' => $data->cat,
                'golongan_nama' => $data->golongan_nama,

                'stat' => $data->stat,
                'jenisn' => $data->jenisn,

                'jenis_nama' => match ((int) $data->jenisn) {
                    1 => 'Penambahan Aset',
                    2 => 'Penambahan Nilai',
                    default => '-',
                },

                'dokumen_pdf' => $data->dokumen_pdf,

                'dokumen_pdf_nama_asli' =>
                $data->dokumen_pdf_nama_asli,

                'dokumen_pdf_size' =>
                $data->dokumen_pdf_size,

                'pdf_preview_url' => $data->dokumen_pdf
                    ? route('nilai.pdf.preview', $data->id)
                    : null,

                'pdf_download_url' => $data->dokumen_pdf
                    ? route('nilai.pdf.download', $data->id)
                    : null,
            ],
        ]);
    }

    /**
     * ==========================================
     * SIMPAN NILAI ASET — DIPERBAIKI
     * ==========================================
     *
     * jenisn = 1 : Penambahan Aset
     * stat   = 0 : Pending K.I.B
     *
     * jenisn = 2 : Penambahan Nilai
     * stat   = 1 : Bukan pending K.I.B
     *
     * Kesalahan validasi dikembalikan
     * langsung ke halaman Nilai Aset.
     */
    public function store(Request $request)
    {
        try {
            // 1. VALIDASI INPUT
            $validated = $this->validateData($request);

            // 2. PERIKSA GOLONGAN DAN KODE AKTIVA
            $this->checkGolonganAktiva($validated);
        } catch (ValidationException $exception) {

            Log::warning('Validasi Simpan Nilai Aset gagal', [
                'cat' => $request->input('cat'),
                'id_aktiva' => $request->input('id_aktiva'),
                'fields' => array_keys($exception->errors()),
            ]);

            // Tidak menggunakan redirect()->back()
            // agar tidak kembali ke halaman Login.
            return redirect()
                ->route('main.nilai')
                ->withErrors($exception->errors())
                ->withInput(
                    $request->except([
                        '_token',
                        '_method',
                        'dokumen_pdf',
                    ])
                );
        }

        // 3. TENTUKAN JENIS TRANSAKSI
        $jenis = (int) $validated['jenisn'];

        $validated['jenisn'] = $jenis;

        // Status dihitung di server, bukan dari form.
        $validated['stat'] = $jenis === 1 ? 0 : 1;

        // 4. PERSIAPKAN PDF
        $pdf = $request->file('dokumen_pdf');

        unset($validated['dokumen_pdf']);

        $uploadedPath = null;

        try {
            // 5. SIMPAN KE POSTGRESQL
            DB::transaction(
                function () use (
                    $validated,
                    $pdf,
                    &$uploadedPath
                ): void {

                    $record = NilaiAktiva::create($validated);

                    // PDF disimpan setelah record dibuat.
                    if ($pdf) {
                        $uploadedPath = $this->storePdf(
                            $record,
                            $pdf
                        );
                    }
                }
            );
        } catch (\Throwable $exception) {

            // Bersihkan file apabila transaksi gagal.
            if ($uploadedPath) {
                Storage::disk('local')
                    ->delete($uploadedPath);
            }

            // Catat penyebab teknis di laravel.log.
            Log::error('Gagal menyimpan Nilai Aset', [
                'cat' => $request->input('cat'),
                'id_aktiva' => $request->input('id_aktiva'),
                'error' => $exception->getMessage(),
            ]);

            // Tetap tampilkan halaman Nilai Aset
            // bersama pesan kegagalan.
            return redirect()
                ->route('main.nilai')
                ->withErrors([
                    'simpan' =>
                    'Data Nilai Aset gagal disimpan. ' .
                        'Periksa isian dan log server.',
                ])
                ->withInput(
                    $request->except([
                        '_token',
                        '_method',
                        'dokumen_pdf',
                    ])
                );
        }

        // 6. REDIRECT SETELAH BERHASIL
        $message = $jenis === 1
            ? 'Penambahan Aset berhasil disimpan. '
            . 'Data tersedia di antrian K.I.B sesuai golongan.'
            : 'Penambahan Nilai berhasil disimpan '
            . 'pada Nilai Aset tanpa membuat antrian K.I.B.';

        return redirect()
            ->route('main.nilai')
            ->with('success', $message);
    }

    /**
     * UPDATE NILAI ASET
     */
    public function update(Request $request, int $nilai)
    {
        $validated = $this->validateData($request);

        $this->checkGolonganAktiva($validated);

        $pdf = $request->file('dokumen_pdf');

        unset($validated['dokumen_pdf']);

        $oldPdf = null;
        $newPdf = null;

        try {
            DB::transaction(
                function () use (
                    $nilai,
                    $validated,
                    $pdf,
                    &$oldPdf,
                    &$newPdf
                ): void {

                    $record = NilaiAktiva::query()
                        ->whereKey($nilai)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $processed =
                        (int) $record->jenisn === 1
                        && (int) $record->stat === 1;

                    $hasLinkedTanah =
                        Schema::hasColumn(
                            'tanahs',
                            'nilai_aktiva_id'
                        )
                        && DB::table('tanahs')
                        ->where(
                            'nilai_aktiva_id',
                            $record->id
                        )
                        ->exists();


                    if ($processed || $hasLinkedTanah) {

                        $exception = ValidationException::withMessages([
                            'jenisn' =>
                            'Data Nilai Aset tidak dapat dihapus '
                                . 'karena sudah diproses atau '
                                . 'terhubung dengan inventaris K.I.B.'
                        ]);

                        // Jika ditolak, tetap kembali ke halaman Nilai Aset.
                        // Jangan menggunakan redirect back secara otomatis.
                        $exception->redirectTo = route('main.nilai');

                        throw $exception;
                    }


                    $jenis = (int) $validated['jenisn'];

                    $validated['stat'] =
                        $jenis === 1 ? 0 : 1;

                    $oldPdf = $record->dokumen_pdf;

                    $record->update($validated);

                    if ($pdf) {
                        $newPdf = $this->storePdf(
                            $record,
                            $pdf
                        );
                    }
                }
            );
        } catch (\Throwable $exception) {
            if ($newPdf) {
                Storage::disk('local')->delete($newPdf);
            }

            throw $exception;
        }

        if ($newPdf && $oldPdf && $oldPdf !== $newPdf) {
            Storage::disk('local')->delete($oldPdf);
        }

        return redirect()
            ->route('main.nilai')
            ->with(
                'success',
                'Data Nilai Aset berhasil diperbarui.'
            );
    }


    /**
     * ==========================================================
     * HAPUS NILAI ASET
     *
     * - Mencegah penghapusan aset yang sudah diproses K.I.B.
     * - Memisahkan validasi Hapus dari Tambah/Edit.
     * - Tidak membuka modal Edit ketika Delete ditolak.
     * - Selalu kembali ke halaman Nilai Aset.
     * ==========================================================
     */
    public function destroy(int $nilai)
    {
        $pdfPath = null;

        DB::transaction(function () use ($nilai, &$pdfPath): void {

            $record = NilaiAktiva::query()
                ->whereKey($nilai)
                ->lockForUpdate()
                ->firstOrFail();

            /*
         * Periksa apakah Nilai Aset telah
         * diproses sebagai inventaris K.I.B.
         */
            $processed =
                (int) $record->jenisn === 1
                && (int) $record->stat === 1;

            /*
         * Periksa hubungan dengan inventaris Tanah.
         */
            $hasLinkedTanah =
                Schema::hasColumn(
                    'tanahs',
                    'nilai_aktiva_id'
                )
                && DB::table('tanahs')
                ->where(
                    'nilai_aktiva_id',
                    $record->id
                )
                ->exists();

            /*
         * Jika tidak boleh dihapus:
         *
         * Gunakan error bag khusus "nilaiDelete".
         *
         * Error ini tidak akan dianggap sebagai
         * kesalahan form Tambah/Edit.
         */
            if ($processed || $hasLinkedTanah) {

                throw ValidationException::withMessages([
                    'delete' =>
                    'Data Nilai Aset tidak dapat dihapus ' .
                        'karena sudah diproses atau terhubung ' .
                        'dengan inventaris K.I.B.'
                ])
                    ->errorBag('nilaiDelete')
                    ->redirectTo(route('main.nilai'));
            }

            /*
         * Simpan path PDF sebelum data dihapus.
         */
            $pdfPath = $record->dokumen_pdf;

            /*
         * Hapus data yang memenuhi persyaratan.
         */
            $record->delete();
        });

        /*
     * Hapus dokumen setelah transaksi
     * database berhasil diselesaikan.
     */
        if ($pdfPath) {
            Storage::disk('local')->delete($pdfPath);
        }

        /*
     * Kembali ke halaman Nilai Aset.
     */
        return redirect()
            ->route('main.nilai')
            ->with(
                'success',
                'Data Nilai Aset berhasil dihapus.'
            );
    }


    /**
     * ==========================================
     * VALIDASI GOLONGAN DENGAN KODE AKTIVA
     * ==========================================
     *
     * Contoh:
     * Golongan Peralatan dan Mesin harus
     * menggunakan kode aktiva Mesin.
     */
    private function checkGolonganAktiva(
        array $validated
    ): void {

        $aktivaKib = DB::table('aktivas')
            ->where(
                'id',
                (int) $validated['id_aktiva']
            )
            ->value('kib');

        // Normalisasi nama klasifikasi K.I.B.
        $normalized = static function (
            ?string $value
        ): string {

            $result = preg_replace(
                '/[^A-Z0-9]+/u',
                ' ',
                mb_strtoupper((string) $value)
            );

            return trim(
                preg_replace(
                    '/\s+/u',
                    ' ',
                    $result ?? ''
                ) ?? ''
            );
        };

        $sourceLabel = $normalized($aktivaKib);

        if ($sourceLabel === '') {
            return;
        }

        $candidates = [];

        $service = app(KibNotificationService::class);

        foreach (
            config('kib.modules', [])
            as $module => $config
        ) {

            $cat = $service->categoryId($module);

            if ($cat === null) {
                continue;
            }

            foreach (
                ($config['aliases'] ?? [])
                as $alias
            ) {

                $alias = $normalized($alias);

                if ($alias === '') {
                    continue;
                }

                if ($alias === $sourceLabel) {

                    $candidates[] = [
                        'cat' => $cat,
                        'score' => 10000,
                    ];
                } elseif (
                    strlen($alias) >= 8
                    && str_contains(
                        $sourceLabel,
                        $alias
                    )
                ) {

                    $candidates[] = [
                        'cat' => $cat,
                        'score' => strlen($alias),
                    ];
                }
            }
        }

        // Kategori belum dikenali.
        if ($candidates === []) {
            return;
        }

        usort(
            $candidates,
            fn($a, $b) =>
            $b['score'] <=> $a['score']
        );

        $expectedCat = (int) $candidates[0]['cat'];

        if (
            $expectedCat
            !== (int) $validated['cat']
        ) {

            throw ValidationException::withMessages([
                'cat' =>
                'Golongan tidak sesuai Kode Aktiva '
                    . 'yang dipilih ('
                    . $aktivaKib
                    . '). Pilih Golongan dan '
                    . 'Kode Aktiva yang sesuai.',
            ]);
        }
    }

    /**
     * ==========================================
     * VALIDASI DATA NILAI ASET
     * ==========================================
     */
    private function validateData(
        Request $request
    ): array {

        return $request->validate(
            [
                'no_voucher' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'tgl_voucher' => [
                    'required',
                    'date',
                ],

                'id_aktiva' => [
                    'required',
                    'integer',
                    Rule::exists(
                        'aktivas',
                        'id'
                    ),
                ],

                'id_lokasi' => [
                    'required',
                    'integer',
                    Rule::exists(
                        'lokasis',
                        'id'
                    ),
                ],

                'dep' => [
                    'required',
                    'integer',
                    Rule::exists(
                        'departemens',
                        'id'
                    ),
                ],

                'div' => [
                    'required',
                    'integer',

                    Rule::exists(
                        'divisis',
                        'id'
                    )->where(
                        function ($query) use ($request) {
                            $query->where(
                                'id_dep',
                                $request->dep
                            );
                        }
                    ),
                ],

                'cat' => [
                    'required',
                    'integer',
                    Rule::exists(
                        'golongans',
                        'id'
                    ),
                ],

                'tahun' => [
                    'required',
                    'digits:4',
                ],

                'jenisn' => [
                    'required',
                    'integer',
                    Rule::in([1, 2]),
                ],

                'nilai' => [
                    'required',
                    'integer',
                    'min:0',
                ],

                'urai' => [
                    'required',
                    'string',
                    'max:10000',
                ],

                'dokumen_pdf' => [
                    'nullable',
                    'file',
                    'mimes:pdf',
                    'mimetypes:application/pdf',
                    'max:15360',
                ],
            ],

            [
                'tgl_voucher.required' =>
                'Tanggal voucher wajib diisi.',

                'id_aktiva.required' =>
                'Aktiva wajib dipilih.',

                'id_lokasi.required' =>
                'Lokasi wajib dipilih.',

                'dep.required' =>
                'Departemen wajib dipilih.',

                'dep.exists' =>
                'Departemen tidak valid.',

                'div.required' =>
                'Divisi wajib dipilih.',

                'div.exists' =>
                'Divisi tidak sesuai dengan Departemen.',

                'cat.required' =>
                'Golongan wajib dipilih.',

                'tahun.required' =>
                'Tahun wajib diisi.',

                'jenisn.required' =>
                'Jenis transaksi wajib dipilih.',

                'nilai.required' =>
                'Nilai aset wajib diisi.',

                'urai.required' =>
                'Uraian wajib diisi.',

                'dokumen_pdf.mimes' =>
                'Dokumen harus berformat PDF.',

                'dokumen_pdf.max' =>
                'Ukuran PDF maksimal 15 MB.',
            ]
        );
    }

    /**
     * ==========================================
     * PREVIEW DOKUMEN PDF
     * ==========================================
     */
    public function previewPdf(int $nilai)
    {
        $record = NilaiAktiva::findOrFail($nilai);

        if (
            !$record->dokumen_pdf
            || !Storage::disk('local')
                ->exists($record->dokumen_pdf)
        ) {
            abort(
                404,
                'Dokumen PDF tidak ditemukan.'
            );
        }

        $path = Storage::disk('local')
            ->path($record->dokumen_pdf);

        $filename =
            $record->dokumen_pdf_nama_asli
            ?: basename($record->dokumen_pdf);

        $filename = str_replace(
            ['"', "\r", "\n"],
            '',
            $filename
        );

        return response()->file(
            $path,
            [
                'Content-Type' =>
                'application/pdf',

                'Content-Disposition' =>
                'inline; filename="'
                    . $filename
                    . '"',
            ]
        );
    }

    /**
     * ==========================================
     * DOWNLOAD DOKUMEN PDF
     * ==========================================
     */
    public function downloadPdf(int $nilai)
    {
        $record = NilaiAktiva::findOrFail($nilai);

        if (
            !$record->dokumen_pdf
            || !Storage::disk('local')
                ->exists($record->dokumen_pdf)
        ) {
            abort(
                404,
                'Dokumen PDF tidak ditemukan.'
            );
        }

        $path = Storage::disk('local')
            ->path($record->dokumen_pdf);

        $filename =
            $record->dokumen_pdf_nama_asli
            ?: basename($record->dokumen_pdf);

        $filename = str_replace(
            ['"', "\r", "\n"],
            '',
            $filename
        );

        return response()->download(
            $path,
            $filename,
            [
                'Content-Type' =>
                'application/pdf',
            ]
        );
    }

    /**
     * ==========================================
     * STORE DOKUMEN PDF
     * ==========================================
     */
    private function storePdf(
        NilaiAktiva $record,
        UploadedFile $file
    ): string {

        $year = $record->tahun
            ?: now()->format('Y');

        $voucher = Str::slug(
            $record->no_voucher
                ?: 'nilai-' . $record->id
        );

        $fileName =
            $voucher
            . '-'
            . now()->format('YmdHis')
            . '-'
            . Str::lower(Str::random(6))
            . '.pdf';

        $path = $file->storeAs(
            'nilai-aset/' . $year,
            $fileName,
            'local'
        );

        try {
            $record->update([
                'dokumen_pdf' =>
                $path,

                'dokumen_pdf_nama_asli' =>
                $file->getClientOriginalName(),

                'dokumen_pdf_size' =>
                $file->getSize(),
            ]);
        } catch (\Throwable $exception) {

            if ($path) {
                Storage::disk('local')
                    ->delete($path);
            }

            throw $exception;
        }

        return $path;
    }

    /**
     * ==========================================
     * DELETE DOKUMEN PDF
     * ==========================================
     */
    private function deletePdf(
        NilaiAktiva $record
    ): void {

        if (
            $record->dokumen_pdf
            && Storage::disk('local')
            ->exists($record->dokumen_pdf)
        ) {

            Storage::disk('local')
                ->delete($record->dokumen_pdf);
        }
    }
}
