<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AsetSecurityHeaders
{
    /**
     * Header dasar untuk respons aplikasi, termasuk HTML, JSON dan PDF.
     * File statis yang dilayani web server perlu aturan tersendiri.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Preview PDF di iframe pada origin Aset tetap diizinkan.
        // Pertahankan kebijakan yang lebih ketat jika sudah ditetapkan.
        if (strtoupper((string) $response->headers->get('X-Frame-Options')) !== 'DENY') {
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        }

        if ($response->headers->get('Referrer-Policy') !== 'no-referrer') {
            $response->headers->set('Referrer-Policy', 'same-origin');
        }

        // Aplikasi internal: jangan simpan respons dinamis di shared cache.
        $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->remove('Expires');

        return $response;
    }
}
