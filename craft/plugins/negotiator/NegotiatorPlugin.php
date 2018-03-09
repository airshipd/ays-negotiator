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
        //Validate phone number
        craft()->on('users.BeforeSaveUser', function (Event $event) {
            /** @var UserModel $user */
            $user = $event->params['user'];

            if(!empty($user->phone) && !preg_match('/^0[45]\d{8}$/', $user->phone)) {
                $user->addError('phone', 'Wrong phone format. Required format is: 04xxxxyyyy');
                $event->performAction = false;
            }
        });

        //Validate location before save
        $inspector_id = null; //old inspector ID
        $inspection_date = null; //old inspection date
        craft()->on('entries.BeforeSaveEntry', function (Event $event) use(&$inspector_id, &$inspection_date) {

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
                    $inspection_date = $old_entry->inspectionDate;
                }
                return $event->performAction = true;
            }
        });

        //Send SMS notification when new inspector is assigned
        craft()->on('entries.SaveEntry', function (Event $event) use(&$inspector_id, &$inspection_date) {
            /** @var EntryModel $entry */
            $entry = $event->params['entry'];

            if($entry->section->handle !== 'inspections') {
                return;
            }

            $ids = $entry->inspector->ids();
            if(!$entry->rescheduled && $ids && $entry->inspectionDate && ($ids[0] != $inspector_id || $inspection_date != $entry->inspectionDate)) {
                //inspector or inspection date changed
                $inspector = craft()->users->getUserById($ids[0]);
                craft()->negotiator_notifications->notifyInspector($inspector, $entry);
                craft()->negotiator_notifications->notifyCustomer($inspector, $entry);
            }
        });
    }
}
