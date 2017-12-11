<?php
namespace Craft;

class Negotiator_ApiController extends BaseController {

  protected $allowAnonymous = true;

  public function actionInspections() {

    $user = craft()->userSession->getUser();
    $ret = [];

    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->section = 'inspections';
    if( ! $user->admin ) {
      $criteria->relatedTo = array(
        'targetElement' => $user,
        'field'         => 'mechanic'
      );
    }
    $criteria->inspectionDate = ">=" . strtotime( date( "d-m-Y",time()) );
    $criteria->order = 'dateCreated asc';
    $inspections = $criteria->find();

    if(count($inspections)) {
      //build out response object
      foreach ($inspections as $i) {
        if(count($i->location->parts)) {
          $temp = array (
            'id' => $i->id,
            'lat' => floatval($i->location->lat),
            'lng' => floatval($i->location->lng),
            'zoom' => intval($i->location->zoom),
            'address' => $i->location->parts['route_short'] . ' ' . $i->location->parts['locality'],
            'title' => $i->getContent()->year . ' ' . $i->getContent()->make . ' ' . $i->getContent()->model,
            'status' => $i->getContent()->inspectionStatus,
            'url' => $i->url
          );
          array_push($ret,$temp);
        }
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
    $id = craft()->request->getSegment(3);

    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->id = $id;
    $inspection = $criteria->first();

    $fieldsToReturn = 'reviewPrice,reviewRequest,maxTotalForCarType,averageTotalForCarType,approximateExpenditure,onsitePhysicalValuation,telephoneEstimatedValuation,approximateExpenditure,customerName,mechanic';
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
