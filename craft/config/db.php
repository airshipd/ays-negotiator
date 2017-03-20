<?php

/**
 * Database Configuration
 *
 * All of your system's database configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/db.php
 */

return array(

	'*' => array(
		'server' => 'localhost',
		'tablePrefix' => 'craft',
	),

	'139.59.111.16' => array (
		'server' => '127.0.0.1',
		'database' => 'negotiator',
		'user' => 'root',
		'password' => '509e8e818eb2b9aacb621c9dece7493b8726a46675989c37',
		'initSQLs' => array("SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';")
	),

	'moneyforcar.com.au' => array (
		'server' => '127.0.0.1',
		'database' => 'negotiator',
		'user' => 'root',
		'password' => '509e8e818eb2b9aacb621c9dece7493b8726a46675989c37',
		'initSQLs' => array("SET SESSION sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';")
	),

	'.local' => array(
		'server' => '127.0.0.1',
		'database' => 'negotiator',
		'user' => 'root',
		'password' => '',
	)

);
