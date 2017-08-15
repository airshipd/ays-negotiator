<?php

/**
 * General Configuration
 *
 * All of your system's general configuration settings go in here.
 * You can see a list of the default settings in craft/app/etc/config/defaults/general.php
 */

// Define some constants that let us set up some environment variables:
// (eg. siteUrl)
define('URI_SCHEME', (isset($_SERVER['HTTPS'] ) ) ? "https://" : "http://");
define('SITE_URL',    URI_SCHEME.getenv('CRAFT_SITE_URL'));

define('BASE_PATH', realpath(CRAFT_BASE_PATH . '/../public_html'));

return array(

  // Defaults for all environments:
  '*' => array(
    'devMode' => true,
    'omitScriptNameInUrls' => true,
    'autoLoginAfterAccountActivation' => true,
    'loginPath' => 'login',
    'logoutPath' => 'logout',
    'userSessionDuration' => 'P2W',
    'localDevelopment' => false,
    // Base site URL
    'siteUrl' => SITE_URL,
    'siteName' => getenv('CRAFT_SITE_NAME'),
    'environmentVariables' => array(
      // siteUrl is set automatically based on server name (see above):
      // Use it to, eg. set assets location: {siteUrl}/assets
      'siteUrl' => SITE_URL.'/',
      'basePath' => BASE_PATH.'/'
    ),
  ),

  // Dev site configuration:
  '.local' => array(
    'localDevelopment' => true,
    'devMode' => true,
    'enableTemplateCaching' => false, // In dev mode we always want to see the latest changes to a template:
  ),
  '.dev' => array(
    'localDevelopment' => true,
    'devMode' => true,
    'enableTemplateCaching' => false, // In dev mode we always want to see the latest changes to a template:
  ),

  // Dev site configuration:
  '128.199.116.0' => array(
    'localDevelopment' => false,
    'devMode' => true,
    'enableTemplateCaching' => false, // In dev mode we always want to see the latest changes to a template:
  ),

);
