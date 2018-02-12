<?php
namespace Craft;

class NegotiatorCommand extends BaseCommand
{
    public function actionSync_inspections()
    {
        $since = craft()->negotiator_sync->getLastSyncTime();

        $i = 0;
        $last_read = time();
        while(++$i) {
            $last_read = time();
            $records = craft()->negotiator_sync->fetch($since, $i);
            if(empty($records)) {
                break;
            }

            $models = Negotiator_RunbikeshopModel::populateModels($records);
            foreach($models as $model) {
                craft()->negotiator_sync->saveRecord($model);
            }
        }

        craft()->negotiator_sync->setLastSyncTime($last_read);
    }
}