<?php

declare(strict_types=1);

namespace App\Modules\Admin\FlashSale;

use App\Config\Database;
use App\Models\FlashSale;

class FlashSaleService
{
    private FlashSale $model;

    public function __construct()
    {
        $this->model = new FlashSale(Database::getInstance());
    }

    public function getActive(): array
    {
        return ['success' => true, 'data' => $this->model->findActive()];
    }

    public function getAll(): array
    {
        return ['success' => true, 'data' => $this->model->findAll()];
    }

    public function getById(int $id): array
    {
        $sale = $this->model->findById($id);
        if (!$sale) {
            return ['success' => false, 'error' => 'Flash sale not found.', 'code' => 404];
        }
        return ['success' => true, 'data' => $sale];
    }

    public function create(array $data): array
    {
        $validation = $this->validate($data);
        if ($validation !== null) {
            return $validation;
        }

        $id   = $this->model->create($data);
        $sale = $this->model->findById($id);
        return ['success' => true, 'data' => $sale];
    }

    public function update(int $id, array $data): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Flash sale not found.', 'code' => 404];
        }

        $validation = $this->validate($data);
        if ($validation !== null) {
            return $validation;
        }

        $this->model->update($id, $data);
        return ['success' => true, 'data' => $this->model->findById($id)];
    }

    public function delete(int $id): array
    {
        if (!$this->model->findById($id)) {
            return ['success' => false, 'error' => 'Flash sale not found.', 'code' => 404];
        }
        $this->model->delete($id);
        return ['success' => true, 'data' => ['message' => 'Flash sale deleted.']];
    }

    private function validate(array $data): ?array
    {
        if (empty($data['product_id'])) {
            return ['success' => false, 'error' => 'product_id is required.', 'code' => 400];
        }
        if (empty($data['sale_price']) || $data['sale_price'] <= 0) {
            return ['success' => false, 'error' => 'Valid sale_price is required.', 'code' => 400];
        }
        if (empty($data['starts_at']) || empty($data['ends_at'])) {
            return ['success' => false, 'error' => 'starts_at and ends_at are required.', 'code' => 400];
        }
        if (strtotime($data['ends_at']) <= strtotime($data['starts_at'])) {
            return ['success' => false, 'error' => 'ends_at must be after starts_at.', 'code' => 400];
        }
        return null;
    }
}
