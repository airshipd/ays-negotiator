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

    private $authToken;

    /**
     * @param DateTime $since
     * @param int      $page
     * @return array
     */
    public function fetch(DateTime $since, $page = 1) {
        $client = new GuzzleClient(self::API_ENDPOINT);
        $request = $client->get(null, [
            'Authorization' => $this->getAuthToken()
        ], [
            'query' => [
                'page' => $page,
                'since' => $since->setTimezone(new \DateTimeZone('UTC'))->atom(),
                'commit' => 'true', //it's required for the filtering to work
                'colour' => 'blue', //only records with "appointment" status
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
     * @param Negotiator_RunbikestopModel $model
     * @return int one of the STATUS-constants
     * @throws Exception
     * @throws \Exception
     */
    public function saveRecord(Negotiator_RunbikestopModel $model)
    {
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        if($criteria->total(['runbikestopId' => $model->id])) {
            return self::STATUS_DUPLICATE;
        }

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
            'buildDate'              => $model->build_year ? $model->build_year . '-01-01' : '1900-01-01',
            'customerName'           => $model->name ?: 'UNKNOWN',
            'runbikestopId'         => $model->id,

            //all other fields
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
        ];
        if ($model->address) {
            $content['location'] = ['address' => $model->address];
        }
        if($model->inspector_email) {
            $criteria = craft()->elements->getCriteria(ElementType::User);
            $criteria->email = $model->inspector_email;
            $user = $criteria->first();
            if($user) {
                $content['inspector'] = [$user->id];
            }
        }
        if($model->year) {
            $content['year'] = $model->year;
        }

        $entry->setContentFromPost(array_filter($content));
        $entry->scenario = self::ENTRY_SCENARIO_SYNC;

        $result = craft()->entries->saveEntry($entry);

        if ($result) {
            return self::STATUS_SUCCESS;
        } else {
            $failed = [];
            $required_defaults = [
                'year' => 0,
                'buildDate' => '1900-01-01',
            ];

            foreach($entry->getErrors() as $attribute => $errors) {
                $failed[$attribute] = $entry->getContent()->$attribute;
                $entry->getContent()->$attribute = $required_defaults[$attribute] ?? null;
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
}
