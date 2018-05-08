<?php

namespace Craft;

use Guzzle\Common\Exception\RuntimeException;
use Guzzle\Http\Client as GuzzleClient;

class Negotiator_SyncService extends BaseApplicationComponent
{
    const ENTRY_SCENARIO_SYNC = 'sync';
    const AUTH_ENDPOINT = 'https://runbikestop.com/appsdata/authentications/authenticate_admin';

    const STATUS_SUCCESS = 1;
    const STATUS_DUPLICATE = 2;
    const STATUS_WARNING = 3;
    const STATUS_ERROR = 4;
    const STATUS_UPDATED = 5;

    const SOURCE_CRM = 'crm';
    const SOURCE_SMC_AUSTRALIA = 'australiacars';
    const SOURCE_GUMTREES = 'gumtrees';
    const SOURCE_SMC_TODAY = 'sellings';

    private $endpoints = [
        self::SOURCE_CRM           => 'https://runbikestop.com/appsdata/inquests',
        self::SOURCE_SMC_AUSTRALIA => 'https://runbikestop.com/appsdata/australiacars',
        self::SOURCE_GUMTREES      => 'https://runbikestop.com/appsdata/gumtrees',
        self::SOURCE_SMC_TODAY     => 'https://runbikestop.com/appsdata/sellings',
    ];

    private $authToken;

    public function syncAllSources()
    {
        $this->syncFromSource(self::SOURCE_CRM);
        $this->syncFromSource(self::SOURCE_SMC_AUSTRALIA);
        $this->syncFromSource(self::SOURCE_GUMTREES);
        $this->syncFromSource(self::SOURCE_SMC_TODAY);

        $this->setLastSyncTime(time());
    }

    private function syncFromSource($source)
    {
        $stats = [
            Negotiator_SyncService::STATUS_SUCCESS   => 0,
            Negotiator_SyncService::STATUS_DUPLICATE => 0,
            Negotiator_SyncService::STATUS_UPDATED   => 0,
            Negotiator_SyncService::STATUS_WARNING   => 0,
            Negotiator_SyncService::STATUS_ERROR     => 0,
        ];

        $i = 0;
        while(++$i) {
            $records = $this->fetch($source, $i);
            if(empty($records)) {
                break;
            }

            $models = Negotiator_RunbikestopModel::populateModels($records);
            foreach($models as $model) { /** @var Negotiator_RunbikestopModel $model */
                $identical = $this->getEntryByRbsId($model->id, $source);

                if ($model->colour === 'blue') {
                    if ($identical) {
                        if($this->revisePrices($identical, $model, $source) || $this->syncSalesConsultant($identical, $model)) {
                            craft()->entries->saveEntry($identical);
                            ++$stats[Negotiator_SyncService::STATUS_UPDATED];
                        } else {
                            ++$stats[Negotiator_SyncService::STATUS_DUPLICATE];
                        }
                    } else {
                        $status = $this->saveRecord($model, $source);
                        ++$stats[$status];
                    }
                }
            }
        }


        if(array_sum($stats)) {
            NegotiatorPlugin::log(sprintf('Synced. Source: %s. Success: %d, duplicate: %d, updated: %d, warning: %d, error: %d',
                $source,
                $stats[Negotiator_SyncService::STATUS_SUCCESS],
                $stats[Negotiator_SyncService::STATUS_DUPLICATE],
                $stats[Negotiator_SyncService::STATUS_UPDATED],
                $stats[Negotiator_SyncService::STATUS_WARNING],
                $stats[Negotiator_SyncService::STATUS_ERROR]
            ));
        }
    }

    /**
     * @param string $source
     * @param int    $page
     * @return array
     * @throws Exception
     */
    private function fetch($source, $page = 1) {
        $client = new GuzzleClient($this->endpoints[$source]);
        $since = (new DateTime('now', new \DateTimeZone('UTC')))->sub(new \DateInterval('P5D'))->atom(); //5 days back from now
        $request = $client->get(null, [
            'Authorization' => $this->getAuthToken()
        ], [
            'query' => [
                'page' => $page,
                'since' => $since,
            ]
        ]);
        $response = $request->send();
        return $response->json();
    }

    private function getAuthToken()
    {
        if(!$this->authToken) {
            $client = new GuzzleClient(self::AUTH_ENDPOINT);
            $request = $client->post(null, null, [
                'email' => getenv('RUNBIKESTOP_EMAIL'),
                'password' => getenv('RUNBIKESTOP_PASSWORD'),
            ]);

            $response = $request->send();

            try {
                $decoded = $response->json();
            } catch (RuntimeException $e) {
                //
            }

            if(empty($decoded['auth_token'])) {
                throw new Exception('RunBikeStop Auth Failed: ' . $response->getBody(true));
            }
            $this->authToken = $decoded['auth_token'];
        }

        return $this->authToken;
    }

    /**
     * @return DateTime|null
     */
    private function getLastSyncTime()
    {
        return craft()->globals->getSetByHandle('settings')->last_sync_time;
    }

    private function setLastSyncTime($ts)
    {
        $settings = craft()->globals->getSetByHandle('settings');
        $settings->setContent(['last_sync_time' => $ts]);
        craft()->globals->saveSet($settings);
    }

    /**
     * @param int    $rbs_id
     * @param string $source
     * @return EntryModel
     * @throws Exception
     */
    private function getEntryByRbsId($rbs_id, $source) {
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        return $criteria->first([
            'runbikestopId' => $rbs_id,
            'source' => $source,
        ]);
    }

    /**
     * @param Negotiator_RunbikestopModel $model
     * @param string                      $source
     * @return int one of the STATUS-constants
     * @throws Exception
     */
    private function saveRecord(Negotiator_RunbikestopModel $model, $source)
    {
        $criteria = craft()->elements->getCriteria(ElementType::User);
        $criteria->order = 'id';
        $admin = $criteria->first();

        $section = craft()->sections->getSectionByHandle('inspections');
        $type = $section->getEntryTypes()[0];

        $entry = new EntryModel([
            'sectionId' => $section->id,
            'authorId' => $admin->id,
            'typeId' => $type->id,
        ]);
        $content = [
            //required fields
            'make'                   => $model->make ?: 'UNKNOWN',
            'model'                  => $model->model ?: 'UNKNOWN',
            'customerName'           => $model->name ?: 'UNKNOWN',
            'runbikestopId'          => $model->id,
            'source'                 => $source,

            //all other fields
            'buildDate'              => $model->build_year ? $model->build_year . '-01-01' : null,
            'year'                   => $model->year,
            'customerEmail'          => $model->email,
            'customerMobileNumber'   => $model->phone,
            'engineSize'             => $model->engine,
            'odometer'               => $model->getKms(),
            'series'                 => $model->series,
            'customerState'          => $model->state,
            'customerSuburb'         => $model->city,
            'transmission'           => $model->getTransmission(),
            'carBody'                => $model->body,
            'badge'                  => $model->badge,
            'colour'                 => $model->getColour(),
            'doors'                  => $model->getDoors(),
            'engineType'             => $model->getEngineType(),
            'driveTrain'             => $model->getDriveTrain(),
            'spareKey'               => $model->spare_key == 'yes',
            'serviceHistory'         => in_array($model->log_books, ['yes', 'no', 'partial']) ? $model->log_books : 'no',
            'registrationNumber'     => $model->rego,
            'rego_expiry'            => $model->getRegoExpiry(),
            'sunroof'                => $model->sunroof == 'yes',
            'satNav'                 => $model->sat_nav == 'yes',
            'leatherUpholstery'      => $model->leather == 'yes',
            'seats'                  => $model->seats,
            'driveIn'                => $model->isDriveIn(),
            'localMech'              => $model->isLocalMech(),
            'salesConsultant'        => $model->sales_consultant_email,
        ];
        if ($model->address) {
            $content['location'] = ['address' => $model->address];
        }

        if ($model->mechanic_booked && $model->mechanic_email) {
            $content['inspectionDate'] = [
                'date' => $model->mechanic_booked->format('d/m/Y'),
                'time' => $model->mechanic_booked->format('h:i A'),
            ];

            $criteria = craft()->elements->getCriteria(ElementType::User);
            $criteria->email = $model->mechanic_email;
            $user = $criteria->first();
            if($user) {
                $content['inspector'] = [$user->id];
            }
        }

        if($model->latest_pricing && is_numeric($model->latest_pricing)) {
            $this->setPrices($content, $model->latest_pricing);
        }

        $entry->setContentFromPost(array_filter($content));
        $entry->scenario = self::ENTRY_SCENARIO_SYNC;

        $result = craft()->entries->saveEntry($entry);

        if ($result) {
            return self::STATUS_SUCCESS;
        } else {
            $failed = [];

            foreach($entry->getErrors() as $attribute => $errors) {
                $failed[$attribute] = $entry->getContent()->$attribute;
                $entry->getContent()->$attribute = null;
            }

            NegotiatorPlugin::log('Failed to save some fields. Details: ' . json_encode([
                'fields' => $failed,
                'errors' => $entry->getErrors(),
                'runbikestopId' => $model->id,
                'source' => $source,
            ]), LogLevel::Error, true);

            //resave without failing attributes
            $entry->clearErrors();
            $entry->getContent()->clearErrors();
            $result = craft()->entries->saveEntry($entry);

            if($result) {
                return self::STATUS_WARNING;
            } else {
                NegotiatorPlugin::log('Completely failed to save new entry. Details: ' . json_encode([
                    'attributes' => $entry->getContent()->attributes,
                    'record' => $model->attributes,
                    'errors' => $entry->getErrors(),
                ]), LogLevel::Error, true);

                return self::STATUS_ERROR;
            }
        }
    }

    /**
     * Recalculate all valuations off the most recent latest_pricing for an existing entry
     *
     * @param EntryModel                  $entry
     * @param Negotiator_RunbikestopModel $model
     * @param string                      $source
     * @return bool
     * @throws \Exception
     */
    private function revisePrices(EntryModel $entry, Negotiator_RunbikestopModel $model, $source)
    {
        $changed = false;
        if($model->latest_pricing && is_numeric($model->latest_pricing)) {
            $content = ['runbikestopId' => $entry->getContent()->runbikestopId, 'source' => $source];
            $this->setPrices($content, $model->latest_pricing);

            foreach($content as $key => $value) {
                if($entry->getContent()->$key != $value) {
                    $changed = true;
                    $entry->getContent()->$key = $value;
                }
            }
        }

        return $changed;
    }

    /**
     * @param EntryModel                  $entry
     * @param Negotiator_RunbikestopModel $model
     * @return bool Whether it's changed
     * @throws \Exception
     */
    private function syncSalesConsultant(EntryModel $entry, Negotiator_RunbikestopModel $model)
    {
        if($model->sales_consultant_email && !$entry->getContent()->salesConsultant) {
            $entry->getContent()->salesConsultant = $model->sales_consultant_email;
            return true;
        }

        return false;
    }

    private function setPrices(&$content, $latest_pricing)
    {
        if($latest_pricing <= 1500) {
            NegotiatorPlugin::log(sprintf('Wrong latest pricing: %s. RunBikeStop ID: %d. Source: %s',
                $latest_pricing, $content['runbikestopId'], $content['source']), LogLevel::Warning, true);
            return;
        }

        if ($latest_pricing <= 10000) {
            $content['onsitePhysicalValuation'] = $latest_pricing - 1500;
        } elseif ($latest_pricing <= 15000) {
            $content['onsitePhysicalValuation'] = $latest_pricing - 1750;
        } elseif ($latest_pricing <= 30000) {
            $content['onsitePhysicalValuation'] = $latest_pricing - 2250;
        } else {
            $content['onsitePhysicalValuation'] = $latest_pricing - 3000;
        }

        $content['reviewValuation'] = $content['onsitePhysicalValuation'] + ($content['onsitePhysicalValuation'] <= 30000 ? 500 : 750);
        $content['averageTotalForCarType'] = round($content['onsitePhysicalValuation'] * 0.65);
        $content['maxTotalForCarType'] = round($content['onsitePhysicalValuation'] * 1.22);
    }
}
