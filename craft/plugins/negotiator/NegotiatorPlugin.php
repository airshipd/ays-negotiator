<?php
namespace Craft;

class NegotiatorPlugin extends BasePlugin {

    public function getName() {
         return Craft::t('Negotiator');
    }

    public function getDescription() {
  		return '';
  	}

    public function getVersion() {
        return '1.0.0';
    }

    public function getDeveloper() {
        return 'Matthew Attanasio';
    }

    public function getDeveloperUrl() {
        return 'http://skyfoundry.agency';
    }

    public function hasCpSection() {
        return false;
    }

    public function init() {
      //Event: onBeforeSaveEntry
      craft()->on('entries.BeforeSaveEntry', function(Event $event) {
        $entry = $event->params['entry'];
        $isNewEntry = $event->params['isNewEntry'];
        $isInspectionEntry = $entry->section->handle === 'inspections' ? true : false;
        $isInvalidValidLocation = (
          $entry->location->lat == 0 ||
          $entry->location->lng == 0 ||
          empty($entry->location->address)) ? true : false;

        if ($isNewEntry && $isInspectionEntry && $isInvalidValidLocation) {
          return $event->performAction = false;
        } else {
          return $event->performAction = true;
        }
      });
    }
}
