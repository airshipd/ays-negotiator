<?php
namespace Craft;
/**
* CamelToSpace Plugin
*/
class CamelToSpacePlugin extends BasePlugin
{
  public function getName()
  {
    return Craft::t('Camel To Space');
  }

  public function getVersion()
  {
    return '1.0.0';
  }

  public function getDeveloper()
  {
    return 'Jerry Chai';
  }

  public function getDeveloperUrl()
  {
    return 'http://jerrychai.us';
  }

  public function hasCpSection()
  {
    return false;
  }

  public function addTwigExtension()
  {
    Craft::import('plugins.cameltospace.twigextensions.CamelToSpaceTwigExtension');

    return new CamelToSpaceTwigExtension();
  }
}
