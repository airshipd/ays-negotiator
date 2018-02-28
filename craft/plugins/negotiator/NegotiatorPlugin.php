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
         $inspector_id = null; //old inspector ID

        //Validate location before save
        craft()->on('entries.BeforeSaveEntry', function (Event $event) use(&$inspector_id) {

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
                if(!$isNewEntry) {
                    //get previous inspector ID value
                    $criteria = craft()->elements->getCriteria(ElementType::Entry);
                    $criteria->id = $entry->id;
                    $old_entry = $criteria->first();
                    $ids = $old_entry->inspector->ids();
                    if($ids) {
                        $inspector_id = $ids[0];
                    }
                }
                return $event->performAction = true;
            }
        });

        //Send SMS notification when new inspector is assigned
        craft()->on('entries.SaveEntry', function (Event $event) use(&$inspector_id) {
            /** @var EntryModel $entry */
            $entry = $event->params['entry'];

            if($entry->section->handle !== 'inspections') {
                return;
            }

            $ids = $entry->inspector->ids();
            if($ids && $ids[0] != $inspector_id) {
                //new inspector assigned
                $inspector = craft()->users->getUserById($ids[0]);
                craft()->negotiator_notifications->notifyInspector($inspector, $entry);
            }
        });
    }
}
