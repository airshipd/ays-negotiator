<?php

//Init Dotenv
try {
    $dotenv = new Dotenv\Dotenv(__DIR__ . '/..');
    $dotenv->load();
    $dotenv->required(['DB_HOST','DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'CRAFT_SITE_URL', 'CRAFT_SITE_NAME']);
} catch (Exception $e) {
    exit('Could not find a .env file.');
}