<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

/**
 * Pilot K.I.B A: satu voucher hanya boleh memiliki satu pemilik inventaris.
 * Pointer historis tidak dimigrasikan otomatis; tetap dibaca untuk mencegah
 * hitung ganda sampai rekonsiliasi dilakukan oleh tim Aset/Akuntansi.
 */
class KibVoucherLinkService
{
    public function ready(): bool
    {
        return Schema::hasTable('kib_voucher_links');
    }

    public function assertReady(): void
    {
        if (!$this->ready()) {
            throw ValidationException::withMessages([
                'voucher' => 'Fitur pengaitan belum diaktifkan: migration kib_voucher_links belum diterapkan.',
            ]);
        }
    }

    /** @return array<int, array<int, array{kategori:string, record_id:int, sumber:string}>> */
    public function owners(array $voucherIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $voucherIds))));
        if (!$ids) return [];

        $found = [];
        $append = static function ($id, string $kategori, $recordId, string $sumber) use (&$found): void {
            // Pointer lama dan relasi baru ke aset yang sama dihitung satu pemilik.
            $key = $kategori . ':' . (int) $recordId;
            $found[(int) $id][$key] = [
                'kategori' => $kategori,
                'record_id' => (int) $recordId,
                'sumber' => $sumber,
            ];
        };

        foreach (
            [
                ['tanahs', 'nilai_aktiva_id', 'tanah'],
                ['mesins', 'id_voucher2', 'mesin'],
                ['gedungs', 'nilai_aktiva_id', 'gedung'],
            ] as [$table, $column, $kategori]
        ) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) continue;
            $items = DB::table($table)->whereIn($column, $ids)->get(['id', $column]);
            foreach ($items as $item) {
                $append($item->{$column}, $kategori, $item->id, 'legacy');
            }
        }

        if ($this->ready()) {
            foreach (
                DB::table('kib_voucher_links')->whereIn('nilai_aktiva_id', $ids)
                    ->get(['nilai_aktiva_id', 'kib', 'record_id']) as $item
            ) {
                $append($item->nilai_aktiva_id, $item->kib, $item->record_id, 'pengaitan');
            }
        }
        return array_map('array_values', $found);
    }

    /**
     * Nominal per record Tanah dihitung hanya dari voucher unik yang benar-benar
     * terhubung. Tidak mengubah nilai lokasi dan tidak menyentuh kolom INTEGER.
     *
     * @param array<int, object> $records
     * @return array<int, array{jumlah_voucher:int, nilai_terhubung:int, voucher_ids:array<int,int>}>
     */
    public function totalsForTanah(array $records): array
    {
        $targets = [];
        $voucherIds = [];
        foreach ($records as $record) {
            $id = (int) $record->id;
            $targets[$id] = [];
            if (!empty($record->nilai_aktiva_id)) {
                $targets[$id][] = (int) $record->nilai_aktiva_id;
                $voucherIds[] = (int) $record->nilai_aktiva_id;
            }
        }
        if ($this->ready() && $targets) {
            foreach (
                DB::table('kib_voucher_links')->where('kib', 'tanah')
                    ->whereIn('record_id', array_keys($targets))
                    ->get(['record_id', 'nilai_aktiva_id']) as $link
            ) {
                $targets[(int) $link->record_id][] = (int) $link->nilai_aktiva_id;
                $voucherIds[] = (int) $link->nilai_aktiva_id;
            }
        }
        $nilai = $voucherIds
            ? DB::table('nilai_aktivas')->whereIn('id', array_values(array_unique($voucherIds)))
            ->pluck('nilai', 'id')->all()
            : [];
        $result = [];
        foreach ($targets as $id => $links) {
            $distinct = array_values(array_unique($links));
            $total = 0;
            foreach ($distinct as $voucher) {
                $total += (int) ($nilai[$voucher] ?? 0);
            }
            $result[$id] = [
                'jumlah_voucher' => count($distinct),
                'nilai_terhubung' => $total,
                'voucher_ids' => $distinct,
            ];
        }
        return $result;
    }

    /**
     * Pakai setelah voucher sumber di-lock FOR UPDATE, di dalam transaksi.
     * Global uniqueness berasal dari UNIQUE nilai_aktiva_id di tabel pengaitan
     * dan pemeriksaan tiga pointer legacy.
     */
    public function linkTanah(int $voucherId, int $tanahId, int $lokasiId, ?int $userId): void
    {
        $this->assertReady();
        $owners = $this->owners([$voucherId]);
        if (!empty($owners[$voucherId])) {
            throw ValidationException::withMessages([
                'voucher' => 'Voucher sudah terhubung dengan inventaris. Silakan lihat barang tujuan.',
            ]);
        }

        DB::table('kib_voucher_links')->insert([
            'nilai_aktiva_id' => $voucherId,
            'kib' => 'tanah',
            'record_id' => $tanahId,
            'id_lokasi' => $lokasiId,
            'created_by' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
