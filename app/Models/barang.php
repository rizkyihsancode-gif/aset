<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    protected $table = 'barangs';

    protected $primaryKey = 'id';

    public $timestamps = false;

    protected $fillable = [
        'nama_barang',
        'kode_barang',
        'golongan',
    ];
}
