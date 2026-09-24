/*
|--------------------------------------------------------------------------
| SISTEM ASET
| Login Page
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Show / Hide Password
|--------------------------------------------------------------------------
*/

function togglePassword() {

    const password =
        document.getElementById('password');

    const button =
        document.getElementById('passwordToggle');


    if (!password || !button) {

        return;

    }



    /*
    |--------------------------------------------------------------------------
    | Show
    |--------------------------------------------------------------------------
    */

    if (password.type === 'password') {

        password.type =
            'text';


        button.innerHTML =
            '<i data-lucide="eye-off"></i>';


        button.setAttribute(
            'aria-label',
            'Sembunyikan password'
        );


        button.setAttribute(
            'title',
            'Sembunyikan password'
        );

    }


    /*
    |--------------------------------------------------------------------------
    | Hide
    |--------------------------------------------------------------------------
    */

    else {

        password.type =
            'password';


        button.innerHTML =
            '<i data-lucide="eye"></i>';


        button.setAttribute(
            'aria-label',
            'Tampilkan password'
        );


        button.setAttribute(
            'title',
            'Lihat password'
        );

    }



    /*
    |--------------------------------------------------------------------------
    | Refresh Lucide Icon
    |--------------------------------------------------------------------------
    */

    if (window.lucide) {

        lucide.createIcons();

    }

}