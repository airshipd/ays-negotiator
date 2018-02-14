<?php

namespace Craft;

use Guzzle\Http\Client as GuzzleClient;

class Negotiator_SyncService extends BaseApplicationComponent
{
    const ENTRY_SCENARIO_SYNC = 'sync';
    const API_ENDPOINT = 'http://runbikestop.com/api/v1/inquests';

    const STATUS_SUCCESS = 1;
    const STATUS_DUPLICATE = 2;
    const STATUS_WARNING = 3;
    const STATUS_ERROR = 4;

    /**
     * @param DateTime $since
     * @param int      $page
     * @return array
     */
    public function fetch(DateTime $since, $page = 1) {
        $client = new GuzzleClient(self::API_ENDPOINT);
        $request = $client->get(null, null, [
            'query' => [
                'page' => $page,
                'since' => $since->setTimezone(new \DateTimeZone('UTC'))->atom(),
                'token' => getenv('RUNBIKESHOP_TOKEN'),
                'commit' => 'true', //we were asked to include this...
                'colour' => 'blue', //only records with "appointment" status
            ]
        ]);

        $response = $request->send();
        return $response->json();
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
     * @param Negotiator_RunbikeshopModel $model
     * @return int one of the STATUS-constants
     * @throws Exception
     * @throws \Exception
     */
    public function saveRecord(Negotiator_RunbikeshopModel $model)
    {
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        if($criteria->total(['runbikeshop_id' => $model->id])) {
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
            'inspectionDate'         => '1900-01-01',
            'runbikeshop_id'         => $model->id,

            //all other fields
            'customerEmail'          => $model->email,
            'customerMobileNumber'   => $model->phone,
            'engineSize'             => $model->engine,
            'odometer'               => $model->getKms(),
            'series'                 => $model->series,
            'customerState'          => $model->state,
            'year'                   => $model->year,
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
            'reviewValuation'        => $model->finance_value,
            'averageTotalForCarType' => $model->getBottomEstimation(),
            'maxTotalForCarType'     => $model->getTopEstimation(),
        ];

        $entry->setContent(array_filter($content));
        $entry->scenario = self::ENTRY_SCENARIO_SYNC;

        $result = craft()->entries->saveEntry($entry);

        if ($result) {
            return self::STATUS_SUCCESS;
        } else {
            $failed = [];
            $required_defaults = [
                'year' => 1900,
                'averageTotalForCarType' => 0,
                'maxTotalForCarType' => 0,
                'buildDate' => '1900-01-01',
            ];

            foreach($entry->getErrors() as $attribute => $errors) {
                $failed[$attribute] = $entry->getContent()->$attribute;
                $entry->getContent()->$attribute = $required_defaults[$attribute] ?? null;
            }

            NegotiatorPlugin::log('Failed to save some fields. Details: ' . json_encode([
                'fields' => $failed,
                'errors' => $entry->getErrors(),
                'runbikeshop_id' => $model->id,
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
