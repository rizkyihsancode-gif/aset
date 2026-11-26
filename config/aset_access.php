<?php

return [
    // Aktifkan hanya setelah migration dan seeder berhasil.
    'enabled' => env('ASET_RBAC_ENABLED', false),

    'modules' => [
        'tanah' => ['code' => 'KIB A', 'label' => 'Tanah'],
        'mesin' => ['code' => 'KIB B', 'label' => 'Peralatan dan Mesin'],
        'gedung' => ['code' => 'KIB C', 'label' => 'Gedung dan Bangunan'],
        'jalan' => ['code' => 'KIB D', 'label' => 'Jalan, Irigasi dan Jaringan'],
        'aset_ttp' => ['code' => 'KIB E', 'label' => 'Aset Tetap Lainnya'],
        'konstruksi' => ['code' => 'KIB F', 'label' => 'Konstruksi'],
        'kir' => ['code' => 'KIR', 'label' => 'Kartu Inventaris Ruangan'],
    ],
];
