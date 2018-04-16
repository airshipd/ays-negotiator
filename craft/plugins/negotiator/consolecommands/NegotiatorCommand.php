<?php
namespace Craft;

class NegotiatorCommand extends BaseCommand
{
    public function actionSync_inspections()
    {
        $since = craft()->negotiator_sync->getLastSyncTime();

        $stats = [
            Negotiator_SyncService::STATUS_SUCCESS   => 0,
            Negotiator_SyncService::STATUS_DUPLICATE => 0,
            Negotiator_SyncService::STATUS_UPDATED   => 0,
            Negotiator_SyncService::STATUS_WARNING   => 0,
            Negotiator_SyncService::STATUS_ERROR     => 0,
        ];

        $i = 0;
        $last_read = time();
        while(++$i) {
            $last_read = time();
            $records = craft()->negotiator_sync->fetch($since, $i);
            if(empty($records)) {
                break;
            }

            $models = Negotiator_RunbikestopModel::populateModels($records);
            foreach($models as $model) { /** @var Negotiator_RunbikestopModel $model */
                $identical = craft()->negotiator_sync->getEntryByRbsId($model->id);

                if ($model->colour === 'blue') {
                    if ($identical) {
                        if(craft()->negotiator_sync->revisePrices($identical, $model) || craft()->negotiator_sync->syncSalesConsultant($identical, $model)) {
                            craft()->entries->saveEntry($identical);
                            ++$stats[Negotiator_SyncService::STATUS_UPDATED];
                        } else {
                            ++$stats[Negotiator_SyncService::STATUS_DUPLICATE];
                        }
                    } else {
                        $status = craft()->negotiator_sync->saveRecord($model);
                        ++$stats[$status];
                    }
                }
            }
        }

        craft()->negotiator_sync->setLastSyncTime($last_read);

        if(array_sum($stats)) {
            NegotiatorPlugin::log(sprintf('Synced. Success: %d, duplicate: %d, updated: %d, warning: %d, error: %d',
                $stats[Negotiator_SyncService::STATUS_SUCCESS],
                $stats[Negotiator_SyncService::STATUS_DUPLICATE],
                $stats[Negotiator_SyncService::STATUS_UPDATED],
                $stats[Negotiator_SyncService::STATUS_WARNING],
                $stats[Negotiator_SyncService::STATUS_ERROR]
            ));
        }
    }

    public function actionSend_followups()
    {
        //Get the entries which weren't sent for follow-up for more than 36 hours
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->limit = null;
        $criteria->section = 'inspections';

        $criteria->inspectionStatus = 'or,Rejected,Submitted';
        $criteria->dateUpdated = '<' . (new DateTime('-36 hours', new \DateTimeZone(craft()->getTimeZone())))->format('Y-m-d H:i:s');
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
}