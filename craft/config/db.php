<?php

/**
 * Database Configuration
 *
 * All of your system's database configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/db.php
 */

return array(

	'*' => array(
		'tablePrefix' => 'craft',
		'server' => getenv('DB_HOST'),
		'port' => getenv('DB_PORT'),
		'user' => getenv('DB_USER'),
		'password' => getenv('DB_PASS'),
		'database' => getenv('DB_NAME'),
		'initSQLs' => array("SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';")
	)
);
