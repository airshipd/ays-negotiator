<?php
namespace Craft;

class Negotiator_InspectionsController extends BaseController {

  protected $allowAnonymous = true;

  public function actionSaveInspection() {

    $theData = $this->requirePostRequest();

    var_dump($theData);
    exit;
  }
}
