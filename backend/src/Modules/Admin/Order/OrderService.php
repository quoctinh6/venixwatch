<?php

declare(strict_types=1);

namespace App\Modules\Admin\Order;

use App\Config\Database;
use App\Models\Order;
use App\Models\OrderItem;

class OrderService
{
    private Order     $orderModel;
    private OrderItem $itemModel;

    public function __construct()
    {
        $pdo              = Database::getInstance();
        $this->orderModel = new Order($pdo);
        $this->itemModel  = new OrderItem($pdo);
    }

    public function paginate(int $page, int $limit, string $status = ''): array
    {
        $result = $this->orderModel->findAll($page, $limit, $status);
        foreach ($result['data'] as &$order) {
            $order['items'] = $this->itemModel->getByOrder((int)$order['id']);
        }
        return [
            'success' => true,
            'data'    => $result['data'],
            'meta'    => [
                'total'       => $result['total'],
                'page'        => $result['page'],
                'limit'       => $result['limit'],
                'total_pages' => (int)ceil($result['total'] / max(1, $result['limit'])),
            ],
        ];
    }

    public function getById(int $id): array
    {
        $order = $this->orderModel->findById($id);
        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.', 'code' => 404];
        }
        $order['items'] = $this->itemModel->getByOrder($id);
        return ['success' => true, 'data' => $order];
    }

    public function updateStatus(int $id, string $status): array
    {
        $allowed = ['pending', 'processing', 'shipping', 'completed', 'cancelled'];
        if (!in_array($status, $allowed, true)) {
            return ['success' => false, 'error' => 'Invalid status value.', 'code' => 400];
        }

        $order = $this->orderModel->findById($id);
        if (!$order) {
            return ['success' => false, 'error' => 'Order not found.', 'code' => 404];
        }

        $this->orderModel->updateStatus($id, $status);
        return ['success' => true, 'data' => $this->orderModel->findById($id)];
    }

    public function getStats(): array
    {
        $stats = $this->orderModel->getStats();
        return ['success' => true, 'data' => $stats];
    }
}
