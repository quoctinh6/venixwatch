<?php

declare(strict_types=1);

namespace App\Controllers\Public;

use App\Config\Database;
use App\Models\Brand;

class BrandController
{
    private Brand $model;

    public function __construct()
    {
        $this->model = new Brand(Database::getInstance());
    }

    public function top(): void
    {
        $limit = max(1, (int)($_GET['limit'] ?? 6));
        echo json_encode([
            'success' => true,
            'data' => $this->model->getTop($limit),
        ]);
    }
}
