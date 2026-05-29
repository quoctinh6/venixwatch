<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config/Config.php';
require_once dirname(__DIR__) . '/config/Database.php';

use App\Config\Config;
use App\Config\Database;

header('Content-Type: text/plain; charset=utf-8');

try {
    Config::load(dirname(__DIR__) . '/.env');
    $pdo = Database::getInstance();

    echo "--- CHECKING USER ---\n";
    $stmt = $pdo->prepare("SELECT id, email, full_name FROM users WHERE email = ?");
    $stmt->execute(['editor@donghoatuan.vn']);
    $user = $stmt->fetch();
    if (!$user) {
        echo "User 'editor@donghoatuan.vn' not found! Seeding now...\n";
        $hash = '$2y$12$yTibnFj9PLg/b9sBNCFxK.dfBuUgDeJgC5jqdUMKmuG1OjXA.GK.a'; // Admin@123456
        $pdo->prepare("INSERT INTO users (email, password_hash, full_name, phone, is_active) VALUES (?, ?, ?, ?, 1)")
            ->execute(['editor@donghoatuan.vn', $hash, 'Editor Venix Watch', '0901234567']);
        
        $stmt->execute(['editor@donghoatuan.vn']);
        $user = $stmt->fetch();
        echo "Created User ID: " . $user['id'] . "\n";
    } else {
        echo "User found: ID " . $user['id'] . ", Name: " . $user['full_name'] . "\n";
    }

    echo "\n--- CHECKING ROLES ---\n";
    $roles = $pdo->query("SELECT * FROM roles")->fetchAll();
    foreach ($roles as $r) {
        echo "Role: ID " . $r['id'] . ", Name: " . $r['name'] . "\n";
    }

    // Ensure 'user_page_editor' role exists
    $stmtRole = $pdo->prepare("SELECT id FROM roles WHERE name = ?");
    $stmtRole->execute(['user_page_editor']);
    $editorRole = $stmtRole->fetch();
    if (!$editorRole) {
        echo "Role 'user_page_editor' not found! Creating now...\n";
        $pdo->prepare("INSERT INTO roles (name, display_name) VALUES (?, ?)")
            ->execute(['user_page_editor', 'User Page Editor']);
        $stmtRole->execute(['user_page_editor']);
        $editorRole = $stmtRole->fetch();
    }
    $editorRoleId = $editorRole['id'];
    echo "user_page_editor Role ID: " . $editorRoleId . "\n";

    echo "\n--- CHECKING PERMISSIONS ---\n";
    // Ensure permissions exist
    $permissions = ['products:read', 'products:write', 'products:quick_edit'];
    foreach ($permissions as $pname) {
        $stmtP = $pdo->prepare("SELECT id FROM permissions WHERE name = ?");
        $stmtP->execute([$pname]);
        $p = $stmtP->fetch();
        if (!$p) {
            echo "Permission '{$pname}' not found! Creating now...\n";
            $pdo->prepare("INSERT INTO permissions (name, display_name, group_name) VALUES (?, ?, ?)")
                ->execute([$pname, ucfirst(str_replace(':', ' ', $pname)), 'Products']);
        }
    }

    echo "\n--- ASSIGNING PERMISSIONS TO ROLE ---\n";
    $pdo->exec("INSERT IGNORE INTO role_permissions (role_id, permission_id)
                SELECT r.id, p.id FROM roles r, permissions p 
                WHERE r.name = 'user_page_editor' 
                  AND p.name IN ('products:read', 'products:write', 'products:quick_edit')
                ON DUPLICATE KEY UPDATE role_id = role_id");
    echo "Permissions assigned to user_page_editor role.\n";

    echo "\n--- ASSIGNING ROLE TO USER ---\n";
    $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)")
        ->execute([$user['id'], $editorRoleId]);
    echo "user_page_editor role assigned to user ID " . $user['id'] . ".\n";

    echo "\n--- VERIFYING USER ROLES & PERMISSIONS ---\n";
    $stmtUserRoles = $pdo->prepare("SELECT r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?");
    $stmtUserRoles->execute([$user['id']]);
    echo "Roles: " . implode(', ', array_column($stmtUserRoles->fetchAll(), 'name')) . "\n";

    $stmtUserPerms = $pdo->prepare("
        SELECT DISTINCT p.name
        FROM permissions p
        INNER JOIN role_permissions rp ON rp.permission_id = p.id
        INNER JOIN user_roles ur ON ur.role_id = rp.role_id
        WHERE ur.user_id = ?
    ");
    $stmtUserPerms->execute([$user['id']]);
    echo "Permissions: " . implode(', ', array_column($stmtUserPerms->fetchAll(), 'name')) . "\n";

    echo "\nSUCCESS: Editor role and permissions configured correctly!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
