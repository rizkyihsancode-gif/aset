<?php

namespace App\Http\Controllers;

use App\Models\NilaiAktiva;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class NilaiAsetController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 20);

        if (!in_array($perPage, [10, 20, 50, 100], true)) {
            $perPage = 20;
        }


        /*
        |--------------------------------------------------------------------------
        | QUERY NILAI ASET
        |--------------------------------------------------------------------------
        */

        $query = DB::table('nilai_aktivas as n')

            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'n.id_lokasi'
            )

            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'n.dep'
            )

            ->leftJoin(
                'divisis as dv',
                'dv.id',
                '=',
                'n.div'
            )

            ->leftJoin(
                'golongans as g',
                'g.id',
                '=',
                'n.cat'
            )

            ->select([
                'n.*',

                'a.kode as aktiva_kode',
                'a.aktiva as aktiva_nama',
                'a.kib as aktiva_kib',

                'l.lokasi as lokasi_nama',

                'd.kode_dep as departemen_nama',

                'dv.nama_div as divisi_nama',

                'g.nama as golongan_nama',
            ]);


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        $search = trim(
            (string) $request->get(
                'search',
                ''
            )
        );


        if ($search !== '') {

            $needle =
                '%' .
                mb_strtolower($search) .
                '%';


            $query->where(
                function ($q) use ($needle) {

                    $q->whereRaw(
                        "LOWER(COALESCE(n.no_voucher, '')) LIKE ?",
                        [$needle]
                    )

                        ->orWhereRaw(
                            "LOWER(COALESCE(n.urai, '')) LIKE ?",
                            [$needle]
                        )

                        ->orWhereRaw(
                            "LOWER(COALESCE(a.aktiva, '')) LIKE ?",
                            [$needle]
                        )

                        ->orWhereRaw(
                            "LOWER(COALESCE(a.kode, '')) LIKE ?",
                            [$needle]
                        )

                        ->orWhereRaw(
                            "LOWER(COALESCE(l.lokasi, '')) LIKE ?",
                            [$needle]
                        )

                        ->orWhereRaw(
                            "LOWER(COALESCE(g.nama, '')) LIKE ?",
                            [$needle]
                        );
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | FILTER
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $nilaiAsets = $query

            ->orderByDesc(
                'n.tgl_voucher'
            )

            ->orderByDesc(
                'n.id'
            )

            ->paginate(
                $perPage
            )

            ->withQueryString();


        /*
        |--------------------------------------------------------------------------
        | MASTER DATA AKTIVA
        |--------------------------------------------------------------------------
        */

        $aktivaOptions = DB::table('aktivas')

            ->select([
                'id',
                'kode',
                'aktiva',
                'kib',
            ])

            ->orderBy('kode')

            ->orderBy('aktiva')

            ->get();


        /*
        |--------------------------------------------------------------------------
        | MASTER LOKASI
        |--------------------------------------------------------------------------
        */

        $lokasiOptions = DB::table('lokasis')

            ->select([
                'id',
                'lokasi',
            ])

            ->orderBy('lokasi')

            ->get();


        /*
        |--------------------------------------------------------------------------
        | MASTER DEPARTEMEN
        |--------------------------------------------------------------------------
        */

        $departemenOptions = DB::table(
            'departemens'
        )

            ->select([
                'id',
                'kode_dep',
            ])

            ->orderBy('kode_dep')

            ->get();


        /*
        |--------------------------------------------------------------------------
        | MASTER DIVISI
        |--------------------------------------------------------------------------
        */

        $divisiOptions = DB::table(
            'divisis'
        )

            ->select([
                'id',
                'id_dep',
                'nama_div',
            ])

            ->orderBy('nama_div')

            ->get();


        /*
        |--------------------------------------------------------------------------
        | MASTER GOLONGAN
        |--------------------------------------------------------------------------
        */

        $golonganOptions = DB::table(
            'golongans'
        )

            ->select([
                'id',
                'nama',
            ])

            ->orderBy('id')

            ->get();


        /*
        |--------------------------------------------------------------------------
        | JENIS NILAI
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | TAHUN
        |--------------------------------------------------------------------------
        */

        $currentYear =
            (int) now(
                'Asia/Makassar'
            )->format('Y');


        $tahunOptions =
            collect(
                range(
                    $currentYear + 10,
                    $currentYear - 30
                )
            );


        /*
        |--------------------------------------------------------------------------
        | KPI
        |--------------------------------------------------------------------------
        */

        $totalNilai =
            (int) DB::table(
                'nilai_aktivas'
            )->sum('nilai');


        $totalTransaksi =
            DB::table(
                'nilai_aktivas'
            )->count();


        $penambahanTahunIni =
            (int) DB::table(
                'nilai_aktivas'
            )

                ->where(
                    'tahun',
                    (string) $currentYear
                )

                ->sum('nilai');


        $tahunAktif =
            DB::table(
                'nilai_aktivas'
            )

            ->whereRaw(
                "tahun ~ '^[0-9]{4}$'"
            )

            ->selectRaw(
                'MAX(tahun::integer)'
            )

            ->value(
                'max'
            );


        $stats = [

            'total_nilai' =>
            $totalNilai,

            'total_transaksi' =>
            $totalTransaksi,

            'penambahan_tahun_ini' =>
            $penambahanTahunIni,

            'tahun_aktif' =>
            $tahunAktif
                ?: $currentYear,

            'delta_tahun' =>
            null,
        ];


        /*
        |--------------------------------------------------------------------------
        | TREND
        |--------------------------------------------------------------------------
        */

        $trendYears =
            collect(
                range(
                    $currentYear - 4,
                    $currentYear
                )
            );


        $trendRaw =
            DB::table(
                'nilai_aktivas'
            )

            ->selectRaw(
                'tahun, SUM(COALESCE(nilai,0)) AS total'
            )

            ->whereIn(
                'tahun',
                $trendYears
                    ->map(
                        fn($tahun) =>
                        (string) $tahun
                    )
                    ->all()
            )

            ->groupBy('tahun')

            ->pluck(
                'total',
                'tahun'
            );


        $trendLabels = [];

        $trendValues = [];


        foreach (
            $trendYears
            as $tahun
        ) {

            $trendLabels[] =
                (string) $tahun;


            $trendValues[] =
                (int) (
                    $trendRaw[(string) $tahun]
                    ?? 0
                );
        }


        /*
        |--------------------------------------------------------------------------
        | DISTRIBUSI GOLONGAN
        |--------------------------------------------------------------------------
        */

        $distribution =
            DB::table(
                'nilai_aktivas as n'
            )

            ->leftJoin(
                'golongans as g',
                'g.id',
                '=',
                'n.cat'
            )

            ->selectRaw(
                "
                COALESCE(
                    g.nama,
                    'Tanpa Golongan'
                ) AS nama,

                SUM(
                    COALESCE(n.nilai,0)
                ) AS total
                "
            )

            ->groupBy(
                'g.id',
                'g.nama'
            )

            ->orderBy('g.id')

            ->get();


        $categoryLabels =
            $distribution
            ->pluck('nama')
            ->values()
            ->all();


        $categoryValues =
            $distribution
            ->pluck('total')
            ->map(
                fn($value) =>
                (int) $value
            )
            ->values()
            ->all();


        return view(
            'main.nilai',
            compact(
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
            )
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW / DETAIL
    |--------------------------------------------------------------------------
    */

    public function show(int $nilai)
    {
        $data = DB::table(
            'nilai_aktivas as n'
        )

            ->leftJoin(
                'aktivas as a',
                'a.id',
                '=',
                'n.id_aktiva'
            )

            ->leftJoin(
                'lokasis as l',
                'l.id',
                '=',
                'n.id_lokasi'
            )

            ->leftJoin(
                'departemens as d',
                'd.id',
                '=',
                'n.dep'
            )

            ->leftJoin(
                'divisis as dv',
                'dv.id',
                '=',
                'n.div'
            )

            ->leftJoin(
                'golongans as g',
                'g.id',
                '=',
                'n.cat'
            )

            ->where(
                'n.id',
                $nilai
            )

            ->select([
                'n.*',

                'a.kode as aktiva_kode',
                'a.aktiva as aktiva_nama',
                'a.kib as aktiva_kib',

                'l.lokasi as lokasi_nama',

                'd.kode_dep as departemen_nama',

                'dv.nama_div as divisi_nama',

                'g.nama as golongan_nama',
            ])

            ->first();


        abort_if(
            !$data,
            404
        );


        return response()->json([
            'success' => true,

            'data' => [

                'id' =>
                $data->id,

                'no_voucher' =>
                $data->no_voucher,

                'tgl_voucher' =>
                $data->tgl_voucher,

                'id_aktiva' =>
                $data->id_aktiva,

                'aktiva_kode' =>
                $data->aktiva_kode,

                'aktiva_nama' =>
                $data->aktiva_nama,

                'aktiva_kib' =>
                $data->aktiva_kib,

                'nilai' =>
                $data->nilai,

                'urai' =>
                $data->urai,

                'tahun' =>
                $data->tahun,

                'id_lokasi' =>
                $data->id_lokasi,

                'lokasi_nama' =>
                $data->lokasi_nama,

                'dep' =>
                $data->dep,

                'departemen_nama' =>
                $data->departemen_nama,

                'div' =>
                $data->div,

                'divisi_nama' =>
                $data->divisi_nama,

                'cat' =>
                $data->cat,

                'golongan_nama' =>
                $data->golongan_nama,

                'stat' =>
                $data->stat,

                'jenisn' =>
                $data->jenisn,

                'jenis_nama' =>
                match ((int) $data->jenisn) {

                    1 =>
                    'Penambahan Aset',

                    2 =>
                    'Penambahan Nilai',

                    default =>
                    '-',
                },

                'dokumen_pdf' =>
                $data->dokumen_pdf,

                'dokumen_pdf_nama_asli' =>
                $data
                    ->dokumen_pdf_nama_asli,

                'dokumen_pdf_size' =>
                $data
                    ->dokumen_pdf_size,

                'pdf_preview_url' =>
                $data->dokumen_pdf

                    ? route(
                        'nilai.pdf.preview',
                        $data->id
                    )

                    : null,

                'pdf_download_url' =>
                $data->dokumen_pdf

                    ? route(
                        'nilai.pdf.download',
                        $data->id
                    )

                    : null,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    public function store(
        Request $request
    ) {
        $validated =
            $this->validateData(
                $request
            );


        $pdf =
            $request->file(
                'dokumen_pdf'
            );


        unset(
            $validated['dokumen_pdf']
        );


        /*
        | Default sistem lama:
        | stat 0 = data baru / belum diproses
        */

        $validated['stat'] =
            0;


        $validated['user'] =
            Auth::id();


        $record =
            NilaiAktiva::create(
                $validated
            );


        if ($pdf) {

            $this->storePdf(
                $record,
                $pdf
            );
        }


        return redirect()

            ->route(
                'main.nilai'
            )

            ->with(
                'success',
                'Data Nilai Aset berhasil ditambahkan.'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        int $nilai
    ) {
        $record =
            NilaiAktiva::findOrFail(
                $nilai
            );


        $validated =
            $this->validateData(
                $request
            );


        $pdf =
            $request->file(
                'dokumen_pdf'
            );


        unset(
            $validated['dokumen_pdf']
        );


        /*
        | Jangan ubah stat lama
        | ketika hanya edit data.
        */

        unset(
            $validated['stat']
        );


        $record->update(
            $validated
        );


        if ($pdf) {

            $this->deletePdf(
                $record
            );


            $this->storePdf(
                $record,
                $pdf
            );
        }


        return redirect()

            ->route(
                'main.nilai'
            )

            ->with(
                'success',
                'Data Nilai Aset berhasil diperbarui.'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy(int $nilai)
    {
        $record =
            NilaiAktiva::findOrFail(
                $nilai
            );


        /*
        | Hapus PDF terlebih dahulu
        */

        $this->deletePdf(
            $record
        );


        $record->delete();


        return redirect()

            ->route(
                'main.nilai'
            )

            ->with(
                'success',
                'Data Nilai Aset berhasil dihapus.'
            );
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
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
                    )
                        ->where(
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
                    Rule::in([
                        1,
                        2,
                    ]),
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

                'id_aktiva.required' =>
                'Aktiva wajib dipilih.',

                'id_lokasi.required' =>
                'Lokasi wajib dipilih.',

                'dep.required' =>
                'Departemen wajib dipilih.',

                'div.required' =>
                'Divisi wajib dipilih.',

                'cat.required' =>
                'Golongan wajib dipilih.',

                'jenisn.required' =>
                'Jenis transaksi wajib dipilih.',

                'nilai.required' =>
                'Nilai wajib diisi.',

                'urai.required' =>
                'Uraian wajib diisi.',

                'dokumen_pdf.mimes' =>
                'Dokumen harus berformat PDF.',

                'dokumen_pdf.max' =>
                'Ukuran PDF maksimal 15 MB.',
            ]
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PDF PREVIEW
    |--------------------------------------------------------------------------
    */

    public function previewPdf(int $nilai)
    {
        $record =
            NilaiAktiva::findOrFail(
                $nilai
            );


        if (
            !$record->dokumen_pdf
            ||
            !Storage::disk('local')
                ->exists(
                    $record->dokumen_pdf
                )
        ) {

            abort(
                404,
                'Dokumen PDF tidak ditemukan.'
            );
        }


        $path =
            Storage::disk('local')
            ->path(
                $record->dokumen_pdf
            );


        $filename =
            $record
            ->dokumen_pdf_nama_asli

            ?: basename(
                $record->dokumen_pdf
            );


        return response()->file(
            $path,
            [
                'Content-Type' =>
                'application/pdf',

                'Content-Disposition' =>
                'inline; filename="' .
                    str_replace(
                        '"',
                        '',
                        $filename
                    )
                    .
                    '"',
            ]
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PDF DOWNLOAD
    |--------------------------------------------------------------------------
    */

    public function downloadPdf(int $nilai)
    {
        $record =
            NilaiAktiva::findOrFail(
                $nilai
            );


        if (
            !$record->dokumen_pdf
            ||
            !Storage::disk('local')
                ->exists(
                    $record->dokumen_pdf
                )
        ) {

            abort(
                404,
                'Dokumen PDF tidak ditemukan.'
            );
        }


        $path =
            Storage::disk('local')
            ->path(
                $record->dokumen_pdf
            );


        $filename =
            $record
            ->dokumen_pdf_nama_asli

            ?: basename(
                $record->dokumen_pdf
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


    /*
    |--------------------------------------------------------------------------
    | STORE PDF
    |--------------------------------------------------------------------------
    */

    private function storePdf(
        NilaiAktiva $record,
        UploadedFile $file
    ): void {

        $year =
            $record->tahun
            ?: now()->format('Y');


        $voucher =
            $record->no_voucher
            ?: 'nilai-' .
            $record->id;


        $voucher =
            Str::slug(
                $voucher
            );


        $fileName =
            $voucher
            .
            '-'
            .
            now()->format(
                'YmdHis'
            )
            .
            '-'
            .
            Str::lower(
                Str::random(6)
            )
            .
            '.pdf';


        $path =
            $file->storeAs(
                'nilai-aset/' .
                    $year,

                $fileName,

                'local'
            );


        $record->update([
            'dokumen_pdf' =>
            $path,

            'dokumen_pdf_nama_asli' =>
            $file
                ->getClientOriginalName(),

            'dokumen_pdf_size' =>
            $file->getSize(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE PDF
    |--------------------------------------------------------------------------
    */

    private function deletePdf(
        NilaiAktiva $record
    ): void {

        if (
            $record->dokumen_pdf
            &&
            Storage::disk('local')
            ->exists(
                $record->dokumen_pdf
            )
        ) {

            Storage::disk('local')
                ->delete(
                    $record->dokumen_pdf
                );
        }
    }
}
