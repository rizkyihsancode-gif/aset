<dialog id="kibPendingModal" class="kib-pending-modal" data-pending-base-url="{{ url('/kib/pending') }}">

    <div class="kib-pending-header">

        <div>

            <span class="kib-pending-eyebrow">

                SUMBER NILAI ASET

            </span>

            <h3 id="kibPendingTitle">

                Data Masuk K.I.B

            </h3>

            <p id="kibPendingDescription">

                Transaksi Nilai Aset yang belum diproses.

            </p>

        </div>


        <button type="button" class="kib-pending-close" id="kibPendingClose" aria-label="Tutup">

            <i data-lucide="x"></i>

        </button>

    </div>


    <div class="kib-pending-toolbar">

        <div class="kib-pending-search">

            <i data-lucide="search"></i>

            <input type="search" id="kibPendingSearch" autocomplete="off"
                placeholder="Cari voucher, lokasi, departemen, divisi, aktiva atau uraian...">

        </div>


        <div class="kib-pending-summary">

            <span>

                Total

                <strong id="kibPendingTotal">
                    0
                </strong>

            </span>


            <span class="is-green">

                Aset Baru

                <strong id="kibPendingNew">
                    0
                </strong>

            </span>


            <span class="is-blue">

                Tambah Nilai

                <strong id="kibPendingValue">
                    0
                </strong>

            </span>

        </div>

    </div>


    <div class="kib-pending-table-wrap">

        <table class="kib-pending-table">

            <thead>

                <tr>

                    <th>No</th>

                    <th>Voucher</th>

                    <th>Lokasi</th>

                    <th>Departemen</th>

                    <th>Divisi</th>

                    <th>Aktiva</th>

                    <th>Jenis</th>

                    <th>Tahun</th>

                    <th>Nilai</th>

                    <th>Uraian</th>

                    <th>Aksi</th>

                </tr>

            </thead>


            <tbody id="kibPendingBody">

                <tr>

                    <td colspan="11" class="kib-pending-empty">

                        Belum ada data yang dimuat.

                    </td>

                </tr>

            </tbody>

        </table>

    </div>


    <div class="kib-pending-footer">

        <span id="kibPendingInfo">

            0 data

        </span>


        <button type="button" class="kib-pending-secondary" id="kibPendingCloseBottom">

            Tutup

        </button>

    </div>

</dialog>
