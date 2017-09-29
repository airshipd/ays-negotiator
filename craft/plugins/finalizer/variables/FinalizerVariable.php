<?php
namespace Craft;

class FinalizerVariable
{
    public function getEntryData($entry)
    {
        return craft()->finalizer_fields->groupFieldsByTabs($entry);
    }
}
