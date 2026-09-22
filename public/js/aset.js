/*
|--------------------------------------------------------------------------
| Sidebar Toggle
|--------------------------------------------------------------------------
*/

function toggleSidebar() {

    const sidebar =
        document.getElementById('sidebar');

    const overlay =
        document.getElementById('sidebarOverlay');


    /*
    |--------------------------------------------------------------------------
    | MOBILE
    |--------------------------------------------------------------------------
    */

    if (window.innerWidth <= 820) {

        if (!sidebar) {
            return;
        }

        sidebar.classList.toggle('open');


        if (overlay) {
            overlay.classList.toggle('show');
        }


        return;
    }


    /*
    |--------------------------------------------------------------------------
    | DESKTOP
    |--------------------------------------------------------------------------
    */

    document.body.classList.toggle(
        'sidebar-collapsed'
    );


    /*
    Simpan kondisi sidebar.

    Jadi kalau user refresh browser,
    posisi sidebar tetap sama.
    */

    const collapsed =
        document.body.classList.contains(
            'sidebar-collapsed'
        );


    localStorage.setItem(
        'aset-sidebar-collapsed',
        collapsed ? '1' : '0'
    );

}



/*
|--------------------------------------------------------------------------
| Load Sidebar State
|--------------------------------------------------------------------------
*/

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const savedState =
            localStorage.getItem(
                'aset-sidebar-collapsed'
            );


        if (
            savedState === '1' &&
            window.innerWidth > 820
        ) {

            document.body.classList.add(
                'sidebar-collapsed'
            );

        }

    }
);



/*
|--------------------------------------------------------------------------
| Sidebar Dropdown
|--------------------------------------------------------------------------
*/

function toggleMenu(id) {

    /*
    Kalau sidebar sedang collapse,
    buka sidebar terlebih dahulu.
    */

    if (
        document.body.classList.contains(
            'sidebar-collapsed'
        )
    ) {

        document.body.classList.remove(
            'sidebar-collapsed'
        );

        localStorage.setItem(
            'aset-sidebar-collapsed',
            '0'
        );


        /*
        Delay sedikit agar animasi sidebar
        selesai dahulu.
        */

        setTimeout(
            function () {

                const menu =
                    document.getElementById(id);


                if (menu) {
                    menu.classList.toggle('open');
                }

            },
            220
        );


        return;
    }


    const menu =
        document.getElementById(id);


    if (!menu) {
        return;
    }


    menu.classList.toggle('open');

}



/*
|--------------------------------------------------------------------------
| Window Resize
|--------------------------------------------------------------------------
*/

window.addEventListener(
    'resize',
    function () {

        const sidebar =
            document.getElementById('sidebar');

        const overlay =
            document.getElementById(
                'sidebarOverlay'
            );


        if (window.innerWidth > 820) {

            if (sidebar) {
                sidebar.classList.remove('open');
            }


            if (overlay) {
                overlay.classList.remove('show');
            }


            /*
            Kembalikan state desktop
            */

            const savedState =
                localStorage.getItem(
                    'aset-sidebar-collapsed'
                );


            if (savedState === '1') {

                document.body.classList.add(
                    'sidebar-collapsed'
                );

            }

        } else {

            /*
            Di mobile jangan pakai
            collapsed desktop.
            */

            document.body.classList.remove(
                'sidebar-collapsed'
            );

        }

    }
);