<?php
namespace Craft;

class NegotiatorCommand extends BaseCommand
{
    public function actionSync_inspections()
    {
        craft()->negotiator_sync->syncAllSources();
    }

    public function actionScheduled()
    {
        $this->sendFollowups();
        $this->sendNonfollowedAlerts();
        $this->unassignJobs();
    }

    private function sendFollowups()
    {
        //Get the entries which weren't sent for follow-up for more than 72 hours
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->limit = null;
        $criteria->section = 'inspections';

        $criteria->inspectionStatus = 'or,Rejected,Submitted';
        $criteria->dateUpdated = '<' . (new DateTime('-72 hours', new \DateTimeZone(craft()->getTimeZone())))->format('Y-m-d H:i:s');
        $criteria->runbikestopId = ':notempty:';
        $inspections = $criteria->find();

        $ids = [];
        foreach ($inspections as $inspection) { /** @var EntryModel $inspection */
            $inspection->getContent()->inspectionStatus = 'Unsuccessful';
            $inspection->getContent()->notes = 'THIS CAR HAS BEEN AUTO SENT TO YOU TO FOLLOW UP - IF YOU NEED MORE INFO SPEAK TO THE NEGOTIATOR';
            $ids[] = $inspection->getContent()->elementId;
            craft()->entries->saveEntry($inspection);
        }

        if ($ids) {
            NegotiatorPlugin::log('Automatically sent for follow-up ids: ' . implode(', ', $ids));
        }
    }

    private function sendNonfollowedAlerts()
    {
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->limit = null;
        $criteria->section = 'inspections';

        $criteria->inspectionStatus = 'Unsuccessful';
        $criteria->dateUpdated = '<' . (new DateTime('-72 hours', new \DateTimeZone(craft()->getTimeZone())))->format('Y-m-d H:i:s');
        $criteria->runbikestopId = ':notempty:';
        $criteria->salesConsultant = ':empty:';
        $inspections = $criteria->find();

        $ids = [];
        foreach ($inspections as $inspection) { /** @var EntryModel $inspection */
            craft()->finalizer_email->sendNissarUnassignedAlert($inspection);
            craft()->entries->saveEntry($inspection); //refresh "dateUpdated"
            $ids[] = $inspection->getContent()->elementId;
        }

        if ($ids) {
            NegotiatorPlugin::log('Not followed-up within 72 hours (alerts to Nissar have been sent): ' . implode(', ', $ids));
        }
    }

    private function unassignJobs()
    {
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->limit = null;
        $criteria->section = 'inspections';

        $criteria->inspectionStatus = 'Unsuccessful';
        $criteria->dateUpdated = '<' . (new DateTime('-72 hours', new \DateTimeZone(craft()->getTimeZone())))->format('Y-m-d H:i:s');
        $criteria->runbikestopId = ':notempty:';
        $criteria->salesConsultant = ':notempty:';
        $inspections = $criteria->find();

        $ids = [];
        foreach ($inspections as $inspection) { /** @var EntryModel $inspection */
            $inspection->getContent()->previousSalesConsultant = $inspection->getContent()->salesConsultant;
            $inspection->getContent()->salesConsultant = null;
            craft()->entries->saveEntry($inspection);
            craft()->finalizer_email->sendUnassignedJobNotification($inspection);
            $ids[] = $inspection->getContent()->elementId;
        }

        if ($ids) {
            NegotiatorPlugin::log('Not processed within 72 hours (automatically unassigned): ' . implode(', ', $ids));
        }
    }
}