<?php

declare(strict_types=1);

namespace App\Modules\Admin\Category;

use App\Config\Database;
use App\Models\Category;

class CategoryService
{
    private Category $model;

    public function __construct()
    {
        $this->model = new Category(Database::getInstance());
    }

    public function getTree(): array
    {
        return [
            'success' => true,
            'data'    => $this->model->getTree(),
        ];
    }

    public function getAll(): array
    {
        return [
            'success' => true,
            'data'    => $this->model->findAll(),
        ];
    }

    public function getActive(): array
    {
        return [
            'success' => true,
            'data'    => $this->model->getActive(),
        ];
    }

    public function getById(int $id): array
    {
        $cat = $this->model->findById($id);
        if (!$cat) {
            return ['success' => false, 'error' => 'Category not found.', 'code' => 404];
        }
        return ['success' => true, 'data' => $cat];
    }

    public function create(array $data): array
    {
        if (empty($data['name'])) {
            return ['success' => false, 'error' => 'Category name is required.', 'code' => 400];
        }

        if (empty($data['slug'])) {
            $data['slug'] = $this->slugify($data['name']);
        }

        $data['slug'] = $this->ensureUniqueSlug($data['slug']);

        $id  = $this->model->create($data);
        $cat = $this->model->findById($id);
        return ['success' => true, 'data' => $cat];
    }

    public function update(int $id, array $data): array
    {
        $existing = $this->model->findById($id);
        if (!$existing) {
            return ['success' => false, 'error' => 'Category not found.', 'code' => 404];
        }

        if (empty($data['name'])) {
            return ['success' => false, 'error' => 'Category name is required.', 'code' => 400];
        }

        if (empty($data['slug'])) {
            $data['slug'] = $existing['slug'];
        }

        $this->model->update($id, $data);
        return ['success' => true, 'data' => $this->model->findById($id)];
    }

    public function delete(int $id): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Category not found.', 'code' => 404];
        }
        $this->model->delete($id);
        return ['success' => true, 'data' => ['message' => 'Category deleted.']];
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
        $base    = $slug;
        $counter = 1;
        while (true) {
            $existing = $this->model->findBySlug($slug);
            if (!$existing || (int)$existing['id'] === $excludeId) {
                break;
            }
            $slug = $base . '-' . $counter++;
        }
        return $slug;
    }
}
