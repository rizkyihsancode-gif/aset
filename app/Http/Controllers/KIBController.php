<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KIBController extends Controller
{
    public function index()
    {
        $kibTanah = DB::table('kib_tanah')->get();
        $kibMesin = DB::table('kib_mesin')->get();

        return view('kib.jalan', compact('kibTanah', 'kibMesin'));
    }
}
