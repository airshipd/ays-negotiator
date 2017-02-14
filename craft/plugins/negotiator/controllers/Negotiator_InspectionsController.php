<?php
namespace Craft;

class Negotiator_InspectionsController extends BaseController {

  protected $allowAnonymous = true;

  public function actionSaveInspection() {

    $this->requirePostRequest();

    var_dump(craft()->request->getPost());
    exit;
  }
}
