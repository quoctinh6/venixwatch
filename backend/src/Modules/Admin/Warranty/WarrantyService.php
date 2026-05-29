<?php

declare(strict_types=1);

namespace App\Modules\Admin\Warranty;

use App\Config\Database;
use App\Models\Warranty;

class WarrantyService
{
    private Warranty $model;

    public function __construct()
    {
        $this->model = new Warranty(Database::getInstance());
    }

    public function paginate(int $page, int $limit, string $status = '', string $search = ''): array
    {
        $result = $this->model->findAll($page, $limit, $status, $search);
        return [
            'success' => true,
            'data' => $result['data'],
            'meta' => [
                'total' => $result['total'],
                'page' => $result['page'],
                'limit' => $result['limit'],
                'total_pages' => (int)ceil($result['total'] / max(1, $result['limit'])),
            ],
        ];
    }

    public function getById(int $id): array
    {
        $warranty = $this->model->findById($id);
        if (!$warranty) {
            return ['success' => false, 'error' => 'Warranty not found.', 'code' => 404];
        }
        return ['success' => true, 'data' => $warranty];
    }

    public function getBySerial(string $serial): array
    {
        $warranty = $this->model->findBySerial($serial);
        if (!$warranty) {
            return ['success' => false, 'error' => 'No warranty found for this serial number.', 'code' => 404];
        }
        return ['success' => true, 'data' => $warranty];
    }

    public function create(array $data): array
    {
        $required = ['serial_number', 'customer_name', 'customer_phone', 'warranty_expires_at'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'error' => "Field '{$field}' is required.", 'code' => 400];
            }
        }

        $existing = $this->model->findBySerial($data['serial_number']);
        if ($existing) {
            return ['success' => false, 'error' => 'Serial number already registered.', 'code' => 409];
        }

        $id = $this->model->create($data);
        $warranty = $this->model->findById($id);
        return ['success' => true, 'data' => $warranty];
    }

    public function update(int $id, array $data): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Warranty not found.', 'code' => 404];
        }

        $required = ['customer_name', 'customer_phone', 'warranty_expires_at', 'status'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'error' => "Field '{$field}' is required.", 'code' => 400];
            }
        }

        $this->model->update($id, $data);
        return ['success' => true, 'data' => $this->model->findById($id)];
    }

    public function delete(int $id): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Warranty not found.', 'code' => 404];
        }

        $this->model->delete($id);
        return ['success' => true, 'data' => ['message' => 'Warranty deleted.']];
    }
}
