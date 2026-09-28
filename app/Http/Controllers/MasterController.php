<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterController extends Controller
{
    public function dataBarang()
    {
        $barangs = DB::table('barangs')->get();
        return view('master.data_barang', compact('barangs'));
    }

    public function dataDepartemen()
    {
        $departemen = DB::table('departemen')->get();
        return view('master.data_departemen', compact('departemen'));
    }
}
