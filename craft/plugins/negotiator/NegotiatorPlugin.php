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
        craft()->on('entries.BeforeSaveEntry', function (Event $event) {
            /** @var EntryModel $entry */
            $entry = $event->params['entry'];

            //do not validate Location for automatically synced inspections
            if($entry->scenario == Negotiator_SyncService::ENTRY_SCENARIO_SYNC) {
                return $event->performAction = true;
            }

            $isNewEntry             = $event->params['isNewEntry'];
            $isInspectionEntry      = $entry->section->handle === 'inspections';
            $isInvalidValidLocation = !$entry->location->lat || !$entry->location->lng  || empty($entry->location->address);

            if ($isNewEntry && $isInspectionEntry && $isInvalidValidLocation) {
                $entry->addError('location', 'Location is required');
                return $event->performAction = false;
            } else {
                return $event->performAction = true;
            }
        });
    }
}
