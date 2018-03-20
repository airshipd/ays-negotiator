<?php

namespace Craft;

use Guzzle\Common\Exception\RuntimeException;
use Guzzle\Http\Client as GuzzleClient;

class Negotiator_SyncService extends BaseApplicationComponent
{
    const ENTRY_SCENARIO_SYNC = 'sync';
    const API_ENDPOINT = 'https://runbikestop.com/appsdata/inquests';
    const AUTH_ENDPOINT = 'https://runbikestop.com/appsdata/authentications/authenticate_admin';


    const STATUS_SUCCESS = 1;
    const STATUS_DUPLICATE = 2;
    const STATUS_WARNING = 3;
    const STATUS_ERROR = 4;
    const STATUS_DELETED = 5;

    private $authToken;

    /**
     * @param DateTime $since
     * @param int      $page
     * @return array
     * @throws Exception
     */
    public function fetch(DateTime $since, $page = 1) {
        $client = new GuzzleClient(self::API_ENDPOINT);
        $request = $client->get(null, [
            'Authorization' => $this->getAuthToken()
        ], [
            'query' => [
                'page' => $page,
                'since' => $since->setTimezone(new \DateTimeZone('UTC'))->atom(),
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
    public function getLastSyncTime()
    {
        return craft()->globals->getSetByHandle('settings')->last_sync_time;
    }

    public function setLastSyncTime($ts)
    {
        $settings = craft()->globals->getSetByHandle('settings');
        $settings->setContent(['last_sync_time' => $ts]);
        craft()->globals->saveSet($settings);
    }

    /**
     * @param int $rbs_id
     * @return EntryModel
     * @throws Exception
     */
    public function getEntryByRbsId($rbs_id) {
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        return $criteria->first(['runbikestopId' => $rbs_id]);
    }

    /**
     * @param Negotiator_RunbikestopModel $model
     * @return int one of the STATUS-constants
     * @throws Exception
     * @throws \Exception
     */
    public function saveRecord(Negotiator_RunbikestopModel $model)
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
            'runbikestopId'         => $model->id,

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
            'servicePapers'          => $model->log_books == 'yes',
            'registrationNumber'     => $model->rego,
            'rego_expiry'            => $model->getRegoExpiry(),
            'sunroof'                => $model->sunroof == 'yes',
            'satNav'                 => $model->sat_nav == 'yes',
            'leatherUpholstery'      => $model->leather == 'yes',
            'seats'                  => $model->seats,
            'driveIn'                => $model->isDriveIn(),
            'localMech'              => $model->isLocalMech(),
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
        } elseif($model->sales_consultant_email) {
            $criteria = craft()->elements->getCriteria(ElementType::User);
            $criteria->email = $model->sales_consultant_email;
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

    private function setPrices(&$content, $latest_pricing)
    {
        if($latest_pricing <= 1500) {
            NegotiatorPlugin::log(sprintf('Wrong latest pricing: %s. RunBikeStop ID: %d', $latest_pricing, $content['runbikestopId']), LogLevel::Warning, true);
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
