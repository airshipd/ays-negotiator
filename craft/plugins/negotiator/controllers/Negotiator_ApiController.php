<?php
namespace Craft;

class Negotiator_ApiController extends BaseController {

    protected $allowAnonymous = true;

    public function actionInspections()
    {
        $user = craft()->userSession->getUser();
        $upcoming = craft()->request->getQuery('upcoming', false);

        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->section = 'inspections';
        if (!$user->admin) {
            $criteria->relatedTo = [
                'targetElement' => $user,
                'field'         => 'mechanic',
            ];
        }

        if($upcoming) {
            $date = craft()->request->getQuery('date', date('Y-m-d'));

            //Validate "date". It can't more than 7 days in the future and it can't be more than 30 days in the past
            $now = new DateTime(date('Y-m-d')); //don't remove date() parameter. Otherwise it will take h:m:s into account and calculate wrong results
            $dateObject = new DateTime($date);
            $interval = $dateObject->diff($now);
            $diff_days = $interval->format('%r%a');

            if($diff_days < -7 || $diff_days > 30) {
                $dateObject = $now;
            }

            $criteria->inspectionDate = '=' . $dateObject->getTimestamp();
        } else {
            $criteria->inspectionDate = ':empty:';
            $criteria->runbikestopId = ':notempty:';
        }

        $criteria->order = 'dateCreated asc';
        $inspections = $criteria->find();

        //build out response object
        $result = [];
        foreach ($inspections as $i) {
            if($i->location->parts) {
                $parts = $i->location->parts + ['route_short' => '', 'locality' => '']; //sometimes necessary fields may be absent
                $address = trim($parts['route_short'] . ' ' . $parts['locality']) ?: 'TBC';
            } else {
                $address = 'TBC';
            }

            $result[] = [
                'id'      => $i->id,
                'lat'     => $i->location->lat ? floatval($i->location->lat) : null,
                'lng'     => $i->location->lng ? floatval($i->location->lng) : null,
                'zoom'    => intval($i->location->zoom),
                'address' => $address,
                'title'   => $i->getContent()->year . ' ' . $i->getContent()->make . ' ' . $i->getContent()->model,
                'status'  => $i->getContent()->inspectionStatus,
                'url'     => $i->url,
            ];
        }

        $this->returnJson($result);
    }

    public function actionInspection(array $variables = [])
    {
        $criteria     = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->id = $variables['id'];
        $inspection   = $criteria->first();

        $this->returnJson([
            'data' => $this->_processFieldData($inspection),
            'options' => $this->_processOptionData($inspection),
        ]);
    }

    public function actionMechanics()
    {
        $criteria = craft()->elements->getCriteria(ElementType::User);
        $criteria->group = 'mechanics';
        $criteria->order = 'firstName, lastName, email';

        $users = $criteria->find();
        $result = [];
        foreach($users as $user) {
            $result[] = $this->_apifyUser($user);
        }

        $this->returnJson($result);
    }

    public function actionOffer(array $variables = [])
    {
        $criteria     = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->id = $variables['id'];
        $inspection   = $criteria->first();

        $this->returnJson([
            'data'    => $this->_processFieldData($inspection),
            'options' => $this->_processOptionData($inspection),
            'report'  => craft()->negotiator_assessment->calculateOffer($inspection),
            'total'   => craft()->negotiator_offer->calculateOfferTotal($inspection),
        ]);
    }

  public function actionFinalise() {
    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->id = craft()->request->getSegment(3);
    $inspection = $criteria->first();
    $action = craft()->request->getSegment(3);
    $ret = [];

    // set inspection status
    $inspection->getContent()->inspectionStatus = ( $action == 'accept' ) ? 'Accepted' : 'Rejected';
    if ( craft()->entries->saveEntry( $inspection ) ) {
      $ret['status'] = "OK";
      $this->returnJson($ret);
    } else {
      $this->returnErrorJson("Could not save Inspection");
      NegotiatorPlugin::log("Could not save Inspection:".$inspection->id , LogLevel::Info);
    }
  }

  public function actionGetContract() {
    $settings = craft()->globals->getSetByHandle('settings');
    $this->returnJson(['content'=>(string) $settings->contractCopy]);
  }


    private function _processFieldData(BaseElementModel $inspection)
    {
        $ret = [];

        foreach ($inspection->getFieldLayout()->getFields() as $fieldLayoutField) {
            $field = $fieldLayoutField->getField();
            $fieldName = $field->handle;

            switch ($field->type) {
                case 'Users':
                    $ret[$fieldName] = $inspection->$fieldName->ids();
                    break;
                case 'Date':
                    $value           = $inspection->$fieldName !== null ? $inspection->$fieldName->format('d/m/Y') : null;
                    $ret[$fieldName] = $value;
                    break;
                case 'Assets':
                    $ret[$fieldName] = [];
                    foreach($inspection->$fieldName as $asset) { /** @var AssetFileModel $asset */
                        $ret[$fieldName][] = [
                            'id' => $asset->id,
                            'url' => $asset->getUrl(),
                        ];
                    }
                    break;
                // case "SimpleMap_Map":
                //   $fieldName = $field->handle;
                //   $value = array(
                //     'lat'=> $entry->$fieldName->lat,
                //     'lng'=> $entry->$fieldName->lng,
                //     'address'=> $entry->$fieldName->address,
                //     'parts'=> array()
                //   );
                //   $partKeys = array_keys($entry->$fieldName->parts);
                //   for( $i=0; $i < count($entry->$fieldName->parts); $i++ ) {
                //     $value['parts'][$partKeys[$i]] = $entry->$fieldName->parts[$partKeys[$i]];
                //   };
                //   $ret[$fieldName] = $value;
                //   break;
                default:
                    $ret[$fieldName] = $inspection->getContent()->$fieldName;
            }
        }

        return $ret;
    }

    private function _apifyUser(UserModel $user)
    {
        return [
            'id' => $user->id,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'email' => $user->email,
        ];
    }

    private function _processOptionData(BaseElementModel $inspection)
    {
        $ret = [];

        foreach ($inspection->getFieldLayout()->getFields() as $fieldLayoutField) {
            $field = $fieldLayoutField->getField();

            $fieldName     = $field->handle;
            $fieldType     = $field->type;
            $fieldSettings = $field->settings;

            $ret[$fieldName] = [
                'type'     => $fieldType,
                'settings' => $fieldSettings,
            ];
        }
        return $ret;
    }
}
