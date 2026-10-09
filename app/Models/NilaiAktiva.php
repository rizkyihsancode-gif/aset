<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NilaiAktiva extends Model
{
    protected $table = 'nilai_aktivas';

    protected $fillable = [
        'no_voucher',
        'tgl_voucher',
        'id_aktiva',
        'nilai',
        'urai',
        'user',
        'tahun',
        'id_lokasi',
        'dep',
        'div',
        'cat',
        'stat',
        'jenisn',

        'dokumen_pdf',
        'dokumen_pdf_nama_asli',
        'dokumen_pdf_size',
    ];

    protected $casts = [
        'tgl_voucher' => 'date',

        'id_aktiva' => 'integer',
        'nilai' => 'integer',
        'user' => 'integer',
        'id_lokasi' => 'integer',
        'dep' => 'integer',
        'div' => 'integer',
        'cat' => 'integer',
        'stat' => 'integer',
        'jenisn' => 'integer',

        'dokumen_pdf_size' => 'integer',
    ];
}
