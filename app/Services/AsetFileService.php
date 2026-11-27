<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/** Resolve attachments only within the directory approved for the module. */
class AsetFileService
{
    public const PDF = ['application/pdf'];

    public const IMAGE = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
    ];

    public const ATTACHMENT = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    private const EXTENSIONS = [
        'application/pdf' => ['pdf'],
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png' => ['png'],
        'image/webp' => ['webp'],
        'image/gif' => ['gif'],
        'image/bmp' => ['bmp'],
    ];

    /** Reject ambiguous names before a path reaches the filesystem. */
    private function relative(mixed $value): ?string
    {
        if (
            ! is_string($value) || $value === ''
            || preg_match('~[\x00-\x1f\x7f:%\\\\]~', $value)
        ) {
            return null;
        }

        foreach (explode('/', $value) as $part) {
            if ($part === '' || $part === '.' || $part === '..') {
                return null;
            }
        }

        return $value;
    }

    /**
     * Both the approved directory and the file must stay inside the base.
     * Reject directory aliases/symlinks and file symlinks, even when they
     * point to a different file within the same module.
     */
    public function resolve(string $base, string $folder, mixed $name, array $types): ?string
    {
        $folder = $this->relative(trim($folder, '/'));
        $name = $this->relative($name);
        $base = realpath($base);

        if ($folder === null || $name === null || $base === false || ! is_dir($base)) {
            return null;
        }

        $root = $base . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $folder);
        $candidate = $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $name);
        $real = realpath($candidate);

        if (
            realpath($root) !== $root || $real !== $candidate
            || ! is_file($real) || ! is_readable($real)
        ) {
            return null;
        }

        return $this->mime($real, $types) !== null ? $real : null;
    }

    /** MIME is read from the file, not trusted from its database metadata. */
    public function mime(string $file, array $types): ?string
    {
        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file);
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));

        if (
            ! is_string($mime) || ! in_array($mime, $types, true)
            || ! in_array($extension, self::EXTENSIONS[$mime] ?? [], true)
        ) {
            return null;
        }

        if (str_starts_with($mime, 'image/')) {
            $info = @getimagesize($file);

            if (! $info || ($info['mime'] ?? null) !== $mime) {
                return null;
            }
        }

        return $mime;
    }

    public function privateFile(mixed $path, string $folder, array $types): ?string
    {
        $path = $this->relative($path);
        $prefix = trim($folder, '/') . '/';

        if ($path === null || ! str_starts_with($path, $prefix)) {
            return null;
        }

        return $this->resolve(
            Storage::disk('local')->path(''),
            $folder,
            substr($path, strlen($prefix)),
            $types
        );
    }

    /** Only historical basenames or an exact, approved directory prefix. */
    public function legacyFile(mixed $path, string $folder, array $types, ?string $base = null): ?string
    {
        if (! is_string($path)) {
            return null;
        }

        $path = $this->relative(trim(str_replace('\\', '/', $path)));
        $prefix = trim($folder, '/') . '/';

        if ($path === null) {
            return null;
        }

        $name = str_starts_with($path, $prefix) ? substr($path, strlen($prefix)) : $path;

        if (str_contains($name, '/')) {
            return null;
        }

        return $this->resolve($base ?? public_path(), $folder, $name, $types);
    }

    /** Public images never inherit an extension from the client filename. */
    public function publicImageExtension(UploadedFile $file): string
    {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        $mime = $file->isValid() ? $file->getMimeType() : null;
        $info = $mime !== null ? @getimagesize($file->getPathname()) : false;

        if (
            $mime === null || ! isset($extensions[$mime])
            || ! $info || ($info['mime'] ?? null) !== $mime
        ) {
            throw ValidationException::withMessages([
                'img' => 'Gambar harus berformat JPG, PNG, atau WEBP yang valid.',
            ]);
        }

        return $extensions[$mime];
    }

    /** Legacy Tanah PDF names are saved in assets/img/lokasi by the old app. */
    public function tanahPdf(mixed $path): ?string
    {
        return $this->legacyFile($path, 'assets/img/lokasi', self::PDF)
            ?? $this->legacyFile($path, 'assets/img/lokasi', self::PDF, storage_path('app/public'));
    }

    /** Location photos are shared reference data, not arbitrary files. */
    public function locationPhoto(string $path): ?string
    {
        $path = trim(str_replace('\\', '/', $path));
        $folders = [
            'uploads/lokasi',
            'upload/lokasi',
            'assets/uploads/lokasi',
            'assets/upload/lokasi',
            'assets/img/lokasi',
            'images/lokasi',
            'image/lokasi',
            'img/lokasi',
            'foto/lokasi',
            'gambar/lokasi',
        ];

        foreach ([public_path(), storage_path('app/public')] as $base) {
            $realBase = realpath($base);
            $candidate = $path;

            if ($realBase && str_starts_with($candidate, $realBase . '/')) {
                $candidate = substr($candidate, strlen($realBase) + 1);
            } else {
                $candidate = preg_replace('~^(?:public/|storage/app/public/|storage/)~', '', $candidate) ?? '';
            }

            foreach ($folders as $folder) {
                $file = $this->legacyFile($candidate, $folder, self::IMAGE, $base);

                if ($file !== null) {
                    return $file;
                }
            }
        }

        return null;
    }
}
