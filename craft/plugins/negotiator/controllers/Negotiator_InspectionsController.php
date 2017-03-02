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

    if( ! $assessment ) {
      $this->returnErrorJson("Assessment could not be found or saved"); //if we got here lets return false as it didnt work
    }

    $assessment->getContent()->reviewRequest = $thePost['reviewRequest'];
    $assessment->getContent()->reviewPrice = (float) $thePost['reviewPrice'];
    $success = craft()->entries->saveEntry( $assessment );

    if( $success ) {
      NegotiatorPlugin::log("Successfully Saved a review for Inspection:".$assessment->id , LogLevel::Info);

      $ret = [
        "reviewAdjustment"=> $assessment->getContent()->reviewValuation - $assessment->getContent()->onsitePhysicalValuation,
        "totalOffer"=> craft()->negotiator_offer->calculateOfferTotal($assessment),
        "dollarReveiw"=>700
      ];

      $this->returnJson( $ret ); //lets return the Adjustment figure
    } else {
      NegotiatorPlugin::log("An issue occured when trying to saved a review for Inspection:".$assessment->id , LogLevel::Info);
      $this->returnErrorJson("An issue occured when trying to saved a review for Inspection"); //if we got here lets return false as it didnt work
    }
  }

}
