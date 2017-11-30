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
}
