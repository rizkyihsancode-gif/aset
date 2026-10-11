<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Konfigurasi Modul K.I.B
    |--------------------------------------------------------------------------
    |
    | aliases digunakan untuk mencari ID golongan langsung dari tabel
    | golongans. cat_fallback hanya digunakan bila nama golongan tidak
    | ditemukan.
    |
    */

    'modules' => [

        'tanah' => [

            'label' => 'Tanah',

            'url' => '/kib/tanah',

            'icon' => 'map',

            'cat_fallback' => 1,

            'aliases' => [
                'TANAH',
                'KIB A - TANAH',
                'KIB A TANAH',
            ],
        ],


        'mesin' => [

            'label' => 'Peralatan & Mesin',

            'url' => '/kib/mesin',

            'icon' => 'settings',

            'cat_fallback' => 2,

            'aliases' => [
                'PERALATAN DAN MESIN',
                'PERALATAN & MESIN',
                'KIB B - PERALATAN DAN MESIN',
                'KIB B PERALATAN DAN MESIN',
            ],
        ],


        'gedung' => [

            'label' => 'Gedung & Bangunan',

            'url' => '/kib/gedung',

            'icon' => 'building-2',

            'cat_fallback' => 3,

            'aliases' => [
                'GEDUNG DAN BANGUNAN',
                'GEDUNG & BANGUNAN',
                'KIB C - GEDUNG DAN BANGUNAN',
                'KIB C GEDUNG DAN BANGUNAN',
            ],
        ],


        'jalan' => [

            'label' => 'Jalan, Irigasi & Jaringan',

            'url' => '/kib/jalan',

            'icon' => 'route',

            'cat_fallback' => 4,

            'aliases' => [
                'JALAN IRIGASI DAN JARINGAN',
                'JALAN, IRIGASI DAN JARINGAN',
                'JALAN, IRIGASI & JARINGAN',
                'KIB D - JALAN IRIGASI DAN JARINGAN',
                'KIB D JALAN IRIGASI DAN JARINGAN',
            ],
        ],


        'aset_tetap' => [

            'label' => 'Aset Tetap Lainnya',

            'url' => '/kib/aset-tetap',

            'icon' => 'package-open',

            'cat_fallback' => 5,

            'aliases' => [
                'ASET TETAP LAINNYA',
                'KIB E - ASET TETAP LAINNYA',
                'KIB E ASET TETAP LAINNYA',
            ],
        ],


        'konstruksi' => [

            'label' => 'Konstruksi',

            'url' => '/kib/konstruksi',

            'icon' => 'construction',

            'cat_fallback' => 6,

            'aliases' => [
                'KONSTRUKSI',
                'KONSTRUKSI DALAM PENGERJAAN',
                'KIB F - KONSTRUKSI DALAM PENGERJAAN',
            ],
        ],


        'kir' => [

            'label' => 'K.I.R',

            'url' => '/kib/kir',

            'icon' => 'clipboard-list',

            'cat_fallback' => 7,

            'aliases' => [
                'KIR',
                'K.I.R',
                'KARTU INVENTARIS RUANGAN',
                'INVENTARIS / PERANGKAT KANTOR',
            ],
        ],

    ],

];
