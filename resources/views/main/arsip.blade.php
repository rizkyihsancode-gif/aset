@extends('layouts.main')


@section('title', 'Dashboard')


@section('page-title', 'Dashboard')


@section('page-description', 'Ringkasan dan monitoring aset perusahaan')



@section('content')
    <html>

    <head>
        <title>Arsip</title>
    </head>

    <body>
        <h1>Arsip</h1>
        <p>Ini adalah halaman untuk melihat arsip.</p>

        <table border="1">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Arsip</th>
                    <th>Tanggal Arsip</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>Arsip Aset 1</td>
                    <td>2024-01-15</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td>Arsip Aset 2</td>
                    <td>2024-02-20</td>
                </tr>
                <!-- Tambahkan data arsip lainnya sesuai kebutuhan -->
            </tbody>
    </body>

    </html>
@endsection
