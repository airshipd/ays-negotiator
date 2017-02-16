<?php
namespace Craft;

class Negotiator_InspectionsController extends BaseController {

  protected $allowAnonymous = true;

  public function actionReviewInspection() {

    $this->requirePostRequest();
    $thePost = craft()->request->getPost();

    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->id = $thePost['id'];
    $assessment = $criteria->first();

    if( $assessment ) {

      $assessment->getContent()->reviewRequest = $thePost['reviewRequest'];
      $assessment->getContent()->reviewPrice = $thePost['reviewPrice'];
      $success = craft()->entries->saveEntry( $assessment );

      if( $success ) {
        NegotiatorPlugin::log("Successfully Saved a review for Inspection:".$assessment->id , LogLevel::Info);

        $ret = [
          "reviewAdjustment"=>10000,
          "totalOffer"=>20000
        ];

        $this->returnJson( $ret ); //let return the Adjustment figure
      }
    }

    $this->returnErrorJson("Assessment could not be found or saved"); //if we got here lets return false as it didnt work
  }

}
