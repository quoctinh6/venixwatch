<?php

declare(strict_types=1);

namespace App\Modules\Admin\Brand;

use App\Config\Database;
use App\Models\Brand;

class BrandService
{
    private Brand $model;

    public function __construct()
    {
        $this->model = new Brand(Database::getInstance());
    }

    public function getAll(): array
    {
        return ['success' => true, 'data' => $this->model->findAll()];
    }

    public function getById(int $id): array
    {
        $brand = $this->model->findById($id);
        if (!$brand) {
            return ['success' => false, 'error' => 'Brand not found.', 'code' => 404];
        }
        return ['success' => true, 'data' => $brand];
    }

    public function create(array $data): array
    {
        $validation = $this->validate($data);
        if ($validation !== null) {
            return $validation;
        }

        $data['source_name'] = trim((string)$data['source_name']);
        $data['slug'] = $this->ensureUniqueSlug(
            trim((string)($data['slug'] ?? '')) ?: $this->slugify($data['source_name'])
        );

        $existingSource = $this->model->findBySourceName($data['source_name']);
        if ($existingSource) {
            return ['success' => false, 'error' => 'Source name already exists.', 'code' => 400];
        }

        $id = $this->model->create($data);
        return ['success' => true, 'data' => $this->model->findById($id)];
    }

    public function update(int $id, array $data): array
    {
        $existing = $this->model->findById($id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Brand not found.', 'code' => 404];
        }

        $validation = $this->validate($data);
        if ($validation !== null) {
            return $validation;
        }

        $data['source_name'] = trim((string)$data['source_name']);
        $data['slug'] = $this->ensureUniqueSlug(
            trim((string)($data['slug'] ?? '')) ?: $this->slugify($data['source_name']),
            $id
        );

        $sameSource = $this->model->findBySourceName($data['source_name']);
        if ($sameSource && (int)$sameSource['id'] !== $id) {
            return ['success' => false, 'error' => 'Source name already exists.', 'code' => 400];
        }

        $this->model->update($id, $data);
        return ['success' => true, 'data' => $this->model->findById($id)];
    }

    public function delete(int $id): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Brand not found.', 'code' => 404];
        }
        $this->model->delete($id);
        return ['success' => true, 'data' => ['message' => 'Brand deleted.']];
    }

    private function validate(array $data): ?array
    {
        if (empty(trim((string)($data['name'] ?? '')))) {
            return ['success' => false, 'error' => 'Brand name is required.', 'code' => 400];
        }
        if (empty(trim((string)($data['source_name'] ?? '')))) {
            return ['success' => false, 'error' => 'Source name is required.', 'code' => 400];
        }
        return null;
    }

    private function slugify(string $text): string
    {
        $text = mb_strtolower(trim($text));
        $map  = [
            'àáạảãâầấậẩẫăằắặẳẵ' => 'a',
            'èéẹẻẽêềếệểễ'        => 'e',
            'ìíịỉĩ'               => 'i',
            'òóọỏõôồốộổỗơờớợởỡ'  => 'o',
            'ùúụủũưừứựửữ'         => 'u',
            'ỳýỵỷỹ'               => 'y',
            'đ'                   => 'd',
        ];
        foreach ($map as $chars => $replacement) {
            $charArr = preg_split('//u', $chars, -1, PREG_SPLIT_NO_EMPTY);
            $text    = str_replace($charArr, $replacement, $text);
        }
        $text = preg_replace('/[^a-z0-9\s-]/', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        return trim($text, '-');
    }

    private function ensureUniqueSlug(string $slug, int $excludeId = 0): string
    {
        $base = $slug;
        $counter = 1;
        while (true) {
            $existing = $this->model->findBySlug($slug);
            if (!$existing || (int)$existing['id'] === $excludeId) {
                return $slug;
            }
            $slug = $base . '-' . $counter++;
        }
    }
}
