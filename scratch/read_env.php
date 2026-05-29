<?php
$env = dirname(__DIR__) . '/backend/.env';
if (file_exists($env)) {
    echo "Exists!\n";
    echo file_get_contents($env);
} else {
    echo "Does not exist at: $env\n";
}
