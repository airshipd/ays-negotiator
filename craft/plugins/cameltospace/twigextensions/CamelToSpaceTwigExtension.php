<?php
namespace Craft;

use Twig_Extension;
use Twig_Filter_Method;

class CamelToSpaceTwigExtension extends \Twig_Extension
{
    public function getName()
    {
        return 'Enigmail';
    }

    public function getFilters()
    {
        return array(
            'camelToSpace' => new Twig_Filter_Method($this, 'camelToSpace'),
        );
    }

    public function camelToSpace($str)
    {
      $pattern = '/(([A-Z]{1}))/';
        return preg_replace_callback(
            $pattern,
            function ($matches) {return " " .$matches[0];},
            $str
        );
    }
}
