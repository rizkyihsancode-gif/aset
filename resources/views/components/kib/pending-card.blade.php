@props(['module', 'title' => 'Data Baru dari Nilai Aset'])

@inject('kibNotificationService', 'App\Services\KibNotificationService')

@php

    $notification = $kibNotificationService->module($module);

    $total = (int) ($notification['total'] ?? 0);

    $asetBaru = (int) ($notification['aset_baru'] ?? 0);

    $penambahanNilai = (int) ($notification['penambahan_nilai'] ?? 0);
@endphp


<section class="
        kib-incoming-card
        {{ $total > 0 ? 'has-data' : 'is-empty' }}
    ">

    <div class="kib-incoming-icon">

        @if ($total > 0)
            <i data-lucide="bell-ring"></i>
        @else
            <i data-lucide="circle-check-big"></i>
        @endif

    </div>


    <div class="kib-incoming-content">

        <div class="kib-incoming-title-row">

            <div>

                <span class="kib-incoming-eyebrow">

                    DATA NILAI ASET

                </span>


                <h3>

                    {{ $title }}

                </h3>

            </div>


            @if ($total > 0)
                <span class="kib-incoming-count" title="{{ number_format($total, 0, ',', '.') }} data">

                    {{ $total > 999 ? '999+' : number_format($total, 0, ',', '.') }}

                </span>
            @endif

        </div>


        @if ($total > 0)
            <p>

                Ada

                <strong>

                    {{ number_format($total, 0, ',', '.') }}

                </strong>

                transaksi Nilai Aset untuk

                <strong>

                    {{ $notification['label'] }}

                </strong>

                yang belum diproses ke K.I.B.

            </p>


            <div class="kib-incoming-meta">

                <span class="kib-incoming-chip is-new">

                    <i data-lucide="package-plus"></i>

                    {{ number_format($asetBaru, 0, ',', '.') }}

                    Penambahan Aset

                </span>


                <span class="kib-incoming-chip is-value">

                    <i data-lucide="circle-dollar-sign"></i>

                    {{ number_format($penambahanNilai, 0, ',', '.') }}

                    Penambahan Nilai

                </span>

            </div>
        @else
            <p>

                Semua transaksi Nilai Aset untuk

                <strong>
                    {{ $notification['label'] }}
                </strong>

                sudah diproses.

            </p>
        @endif

    </div>


    <div class="kib-incoming-action">

        <button type="button" class="kib-incoming-button" data-kib-open-pending="{{ $module }}"
            @disabled($total === 0)>

            <i data-lucide="inbox"></i>

            <span>

                Lihat Data Masuk

            </span>

        </button>

    </div>

</section>
