<?php
namespace Craft;

class Negotiator_ApiController extends BaseController {

  protected $allowAnonymous = true;

  public function actionMap() {

    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->id = craft()->request->getSegment(2);
    $inspection = $criteria->first();

    $map = array (
      'content' => '',
      'lat' => $inspection->location->lat,
      'lng' => $inspection->location->lng,
      'zoom' => $inspection->location->zoom,
      'address' => $inspection->location->parts['route_short'] . ' ' . $inspection->location->parts['locality'],
      'title' => $inspection->getContent()->year . ' ' . $inspection->getContent()->make . ' ' . $inspection->getContent()->model
    );

    $this->returnJson($map);
  }

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
            'lat' => $i->location->lat,
            'lng' => $i->location->lng,
            'zoom' => $i->location->zoom,
            'address' => $i->location->parts['route_short'] . ' ' . $i->location->parts['locality'],
            'title' => $i->getContent()->year . ' ' . $i->getContent()->make . ' ' . $i->getContent()->model,
            'status' => $i->getContent()->inspectionStatus,
          );
          array_push($ret,$temp);
        }
      }
    }

    $this->returnJson($ret);
  }
}
