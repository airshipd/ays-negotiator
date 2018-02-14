<?php
namespace Craft;

class Negotiator_ApiController extends BaseController {

    protected $allowAnonymous = true;

    public function actionInspections()
    {
        $user = craft()->userSession->getUser();
        $date = craft()->request->getQuery('date', date('Y-m-d'));

        //Validate "date". It can't more than 7 days in the future and it can't be more than 30 days in the past
        $now = new DateTime(date('Y-m-d')); //don't remove date() parameter. Otherwise it will take h:m:s into account and calculate wrong results
        $dateObject = new DateTime($date);
        $interval = $dateObject->diff($now);
        $diff_days = $interval->format('%r%a');

        if($diff_days < -7 || $diff_days > 30) {
            $dateObject = $now;
        }

        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->section = 'inspections';
        if (!$user->admin) {
            $criteria->relatedTo = [
                'targetElement' => $user,
                'field'         => 'mechanic',
            ];
        }
        $criteria->inspectionDate = '=' . $dateObject->getTimestamp();
        $criteria->order = 'dateCreated asc';
        $inspections = $criteria->find();

        //build out response object
        $ret = [];
        foreach ($inspections as $i) {
            if (count($i->location->parts)) {
                $i->location->parts += ['route_short' => '', 'locality' => '']; //sometimes necessary fields may be absent
                $temp = [
                    'id'      => $i->id,
                    'lat'     => floatval($i->location->lat),
                    'lng'     => floatval($i->location->lng),
                    'zoom'    => intval($i->location->zoom),
                    'address' => trim($i->location->parts['route_short'] . ' ' . $i->location->parts['locality']),
                    'title'   => $i->getContent()->year . ' ' . $i->getContent()->make . ' ' . $i->getContent()->model,
                    'status'  => $i->getContent()->inspectionStatus,
                    'url'     => $i->url,
                ];
                array_push($ret, $temp);
            }
        }

        $this->returnJson($ret);
    }

    public function actionInspection() {
        $ret = [];
        $retData = [];
        $retOptions = [];
        $tempArray = [];

        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->id = craft()->request->getSegment(3);
        $inspection = $criteria->first();

        foreach($inspection->getFieldLayout()->getFields() as $fieldLayoutField) {
            array_push($tempArray,craft()->fields->getFieldById($fieldLayoutField->fieldId)->handle);
        }

        $fieldsToReturn = implode(',', $tempArray);
        $inspectionFieldsArray = $inspection->getFieldLayout()->getFields();
        $retData = $this->_processFieldData($inspectionFieldsArray,$fieldsToReturn,$inspection);
        $retOptions = $this->_processOptionData($inspectionFieldsArray,$fieldsToReturn);

        $ret['data'] = $retData;
        $ret['options'] = $retOptions;

        $this->returnJson($ret);
    }

    public function actionOffer() {
        $ret = [];
        $retData = [];
        $retOptions = [];
        $retReport = [];
        $retTotal = [];
        $tempArray = [];
        $id = craft()->request->getSegment(3);

        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->id = $id;
        $inspection = $criteria->first();

        foreach($inspection->getFieldLayout()->getFields() as $fieldLayoutField) {
            array_push($tempArray,craft()->fields->getFieldById($fieldLayoutField->fieldId)->handle);
        }

        $fieldsToReturn = implode(',', $tempArray);
        $inspectionFieldsArray = $inspection->getFieldLayout()->getFields();
        $retData = $this->_processFieldData($inspectionFieldsArray,$fieldsToReturn,$inspection);
        $retOptions = $this->_processOptionData($inspectionFieldsArray,$fieldsToReturn);

        $ret['data'] = $retData;
        $ret['options'] = $retOptions;
        $ret['report'] = craft()->negotiator_assessment->calculateOffer($inspection);
        $ret['total'] = craft()->negotiator_offer->calculateOfferTotal($inspection);

        $this->returnJson($ret);
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


  private function _processFieldData($fieldsArray,$fieldsToReturn,$entry) {
    $ret = [];

    foreach( $fieldsArray as $fieldLayoutField ) {
      $field = craft()->fields->getFieldById($fieldLayoutField->fieldId);

      if( in_array( $field->handle, explode(',',$fieldsToReturn) ) ) {
        switch($field->type) {
          case "Users":
            $user = craft()->users->getUserById($entry->mechanic->ids()[0]);
            if($user) {
              $fieldName = $field->handle;
              $ret[$fieldName] = array(
                'firstName' => $user->firstName,
                'lastName' => $user->lastName,
              );
            }
            break;
          case "Date":
            $fieldName = $field->handle;
            $value = $entry->$fieldName !== null ? $entry->$fieldName->format('d/m/Y') : null;
            $ret[$fieldName] = $value;
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
            $fieldName = $field->handle;
            $ret[$fieldName] = $entry->getContent()->$fieldName;
        }
      }
    }
    return $ret;
  }

  private function _processOptionData($fieldsArray,$fieldsToReturn) {
    $ret = [];

    foreach( $fieldsArray as $fieldLayoutField ) {
      $field = craft()->fields->getFieldById($fieldLayoutField->fieldId);

      if( in_array( $field->handle, explode(',',$fieldsToReturn) ) ) {
        $fieldName = $field->handle;
        $fieldType = $field->type;
        $fieldSettings = $field->settings;

        $ret[$fieldName] = array(
          'type' => $fieldType,
          'settings' => $fieldSettings
        );
      }
    }
    return $ret;
  }
}
