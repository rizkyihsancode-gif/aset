/*
|--------------------------------------------------------------------------
| SISTEM ASET
| GLOBAL JAVASCRIPT
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| BREAKPOINT
|--------------------------------------------------------------------------
*/

const ASSET_MOBILE_BREAKPOINT = 820;



/*
|--------------------------------------------------------------------------
| SIDEBAR TOGGLE
|--------------------------------------------------------------------------
|
| Desktop:
| - Collapse menjadi icon only.
| - Expand kembali.
|
| Mobile:
| - Sidebar slide dari kiri.
| - Overlay muncul.
|
*/

function toggleSidebar() {

    const sidebar =
        document.getElementById('sidebar');

    const overlay =
        document.getElementById('sidebarOverlay');


    if (!sidebar) {

        return;

    }



    /*
    |--------------------------------------------------------------------------
    | MOBILE
    |--------------------------------------------------------------------------
    */

    if (
        window.innerWidth <=
        ASSET_MOBILE_BREAKPOINT
    ) {

        sidebar.classList.toggle(
            'open'
        );


        if (overlay) {

            overlay.classList.toggle(
                'show'
            );

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


    const collapsed =
        document.body.classList.contains(
            'sidebar-collapsed'
        );


    /*
    |--------------------------------------------------------------------------
    | SAVE STATE
    |--------------------------------------------------------------------------
    */

    localStorage.setItem(
        'aset-sidebar-collapsed',
        collapsed ? '1' : '0'
    );

}



/*
|--------------------------------------------------------------------------
| SIDEBAR DROPDOWN
|--------------------------------------------------------------------------
|
| Digunakan oleh:
|
| toggleMenu('masterGroup')
| toggleMenu('kibGroup')
|
*/

function toggleMenu(id) {

    const menu =
        document.getElementById(id);


    if (!menu) {

        return;

    }



    /*
    |--------------------------------------------------------------------------
    | DESKTOP COLLAPSED
    |--------------------------------------------------------------------------
    |
    | Jika sidebar sedang kecil lalu user klik Master Data / KIB,
    | sidebar dibuka dulu.
    |
    */

    if (

        window.innerWidth >
        ASSET_MOBILE_BREAKPOINT

        &&

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
        Tunggu sedikit agar animasi sidebar selesai.
        */

        setTimeout(
            function () {

                menu.classList.toggle(
                    'open'
                );

            },
            220
        );


        return;

    }



    /*
    |--------------------------------------------------------------------------
    | NORMAL TOGGLE
    |--------------------------------------------------------------------------
    */

    menu.classList.toggle(
        'open'
    );

}



/*
|--------------------------------------------------------------------------
| CLOSE MOBILE SIDEBAR
|--------------------------------------------------------------------------
*/

function closeMobileSidebar() {

    const sidebar =
        document.getElementById('sidebar');

    const overlay =
        document.getElementById('sidebarOverlay');


    if (sidebar) {

        sidebar.classList.remove(
            'open'
        );

    }


    if (overlay) {

        overlay.classList.remove(
            'show'
        );

    }

}



/*
|--------------------------------------------------------------------------
| LOAD SAVED SIDEBAR STATE
|--------------------------------------------------------------------------
*/

function loadSidebarState() {

    /*
    Mobile tidak menggunakan collapsed desktop.
    */

    if (

        window.innerWidth <=
        ASSET_MOBILE_BREAKPOINT

    ) {

        document.body.classList.remove(
            'sidebar-collapsed'
        );


        return;

    }


    const savedState =
        localStorage.getItem(
            'aset-sidebar-collapsed'
        );


    if (savedState === '1') {

        document.body.classList.add(
            'sidebar-collapsed'
        );

    } else {

        document.body.classList.remove(
            'sidebar-collapsed'
        );

    }

}



/*
|--------------------------------------------------------------------------
| RESTORE OPEN MENU STATE
|--------------------------------------------------------------------------
|
| Ini opsional tetapi berguna agar dropdown tetap terbuka
| selama halaman aktif berada di dalam group.
|
*/

function restoreOpenMenus() {

    const groups =
        document.querySelectorAll(
            '.sidebar-menu-group'
        );


    groups.forEach(
        function (group) {

            /*
            Jika submenu punya item aktif,
            parent otomatis dibuka.
            */

            const activeChild =
                group.querySelector(
                    '.sidebar-submenu-item.active'
                );


            if (activeChild) {

                group.classList.add(
                    'open'
                );

            }

        }
    );

}



/*
|--------------------------------------------------------------------------
| CLOSE SIDEBAR WHEN CLICKING SUBMENU ON MOBILE
|--------------------------------------------------------------------------
*/

function setupMobileMenuLinks() {

    const links =
        document.querySelectorAll(
            '.sidebar a'
        );


    links.forEach(
        function (link) {

            link.addEventListener(
                'click',
                function () {

                    if (

                        window.innerWidth <=
                        ASSET_MOBILE_BREAKPOINT

                    ) {

                        closeMobileSidebar();

                    }

                }
            );

        }
    );

}



/*
|--------------------------------------------------------------------------
| ESC KEY
|--------------------------------------------------------------------------
|
| Di mobile user bisa tekan ESC untuk menutup sidebar.
|
*/

function setupEscapeSidebar() {

    document.addEventListener(
        'keydown',
        function (event) {

            if (

                event.key === 'Escape'

                &&

                window.innerWidth <=
                ASSET_MOBILE_BREAKPOINT

            ) {

                closeMobileSidebar();

            }

        }
    );

}



/*
|--------------------------------------------------------------------------
| WINDOW RESIZE
|--------------------------------------------------------------------------
*/

window.addEventListener(
    'resize',
    function () {

        const sidebar =
            document.getElementById(
                'sidebar'
            );

        const overlay =
            document.getElementById(
                'sidebarOverlay'
            );


        /*
        |--------------------------------------------------------------------------
        | SWITCH TO DESKTOP
        |--------------------------------------------------------------------------
        */

        if (

            window.innerWidth >
            ASSET_MOBILE_BREAKPOINT

        ) {

            /*
            Hapus mobile state.
            */

            if (sidebar) {

                sidebar.classList.remove(
                    'open'
                );

            }


            if (overlay) {

                overlay.classList.remove(
                    'show'
                );

            }



            /*
            Restore desktop collapsed state.
            */

            const savedState =
                localStorage.getItem(
                    'aset-sidebar-collapsed'
                );


            if (savedState === '1') {

                document.body.classList.add(
                    'sidebar-collapsed'
                );

            } else {

                document.body.classList.remove(
                    'sidebar-collapsed'
                );

            }

        }



        /*
        |--------------------------------------------------------------------------
        | SWITCH TO MOBILE
        |--------------------------------------------------------------------------
        */

        else {

            /*
            Jangan tampilkan collapsed desktop
            pada layar mobile.
            */

            document.body.classList.remove(
                'sidebar-collapsed'
            );

        }

    }
);



/*
|--------------------------------------------------------------------------
| DOM READY
|--------------------------------------------------------------------------
*/

document.addEventListener(
    'DOMContentLoaded',
    function () {

        /*
        Sidebar state
        */

        loadSidebarState();



        /*
        Parent menu
        */

        restoreOpenMenus();



        /*
        Mobile links
        */

        setupMobileMenuLinks();



        /*
        ESC support
        */

        setupEscapeSidebar();



        /*
        |--------------------------------------------------------------------------
        | LUCIDE ICON
        |--------------------------------------------------------------------------
        */

        if (
            window.lucide
        ) {

            lucide.createIcons();

        }

    }
);