<?php
header('Content-Type: application/json');
$password = 'Admin@123456';
$hash1 = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
$verify1 = password_verify($password, $hash1) ? 'YES' : 'NO';

$new_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

echo json_encode([
    'verify_default' => $verify1,
    'new_hash_generated' => $new_hash,
    'verify_new' => password_verify($password, $new_hash) ? 'YES' : 'NO'
]);



