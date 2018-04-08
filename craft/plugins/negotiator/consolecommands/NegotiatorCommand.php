<?php
namespace Craft;

class NegotiatorCommand extends BaseCommand
{
    public function actionSync_inspections()
    {
        $since = craft()->negotiator_sync->getLastSyncTime();

        $stats = [
            Negotiator_SyncService::STATUS_SUCCESS => 0,
            Negotiator_SyncService::STATUS_DUPLICATE => 0,
            Negotiator_SyncService::STATUS_PRICE_UPDATE => 0,
            Negotiator_SyncService::STATUS_WARNING => 0,
            Negotiator_SyncService::STATUS_ERROR => 0,
            Negotiator_SyncService::STATUS_DELETED => 0,
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
                        if(craft()->negotiator_sync->revisePrices($identical, $model)) {
                            ++$stats[Negotiator_SyncService::STATUS_PRICE_UPDATE];
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
            NegotiatorPlugin::log(sprintf('Synced. Success: %d, duplicate: %d, price updated: %d, warning: %d, error: %d, deleted: %d',
                $stats[Negotiator_SyncService::STATUS_SUCCESS],
                $stats[Negotiator_SyncService::STATUS_DUPLICATE],
                $stats[Negotiator_SyncService::STATUS_PRICE_UPDATE],
                $stats[Negotiator_SyncService::STATUS_WARNING],
                $stats[Negotiator_SyncService::STATUS_ERROR],
                $stats[Negotiator_SyncService::STATUS_DELETED]
            ));
        }
    }
}