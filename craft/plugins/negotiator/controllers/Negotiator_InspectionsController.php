<?php
namespace Craft;

use Mpdf\Mpdf;

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
          "reviewAdjustment" => $assessment->getContent()->reviewValuation - $assessment->getContent()->onsitePhysicalValuation,
          "totalOffer"       => craft()->negotiator_offer->calculateOfferTotal($assessment),
      ];
      $this->returnJson( $ret ); //lets return the Adjustment figure
    } else {
        NegotiatorPlugin::log('An issue occurred when trying to save a review for Inspection: ' . $assessment->id . '. Error: ' . $errors, LogLevel::Info);
        $this->returnErrorJson('An issue occurred when trying to save a review for Inspection'); //if we got here lets return false as it didnt work
    }
  }

  /**
   * @throws Exception
   * @throws HttpException
   * @throws \Exception
   */
  public function actionUpdateValuation() {

    $this->requirePostRequest();
    $thePost = craft()->request->getPost();

    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->id = $thePost['id'];
    $assessment = $criteria->first();

    if( ! $assessment ) {
      $this->returnErrorJson("Assessment could not be found or saved"); //if we got here lets return false as it didnt work
    }

    $assessment->getContent()->onsitePhysicalValuation = (float)$thePost['onsitePhysicalValuation'];
    $assessment->getContent()->averageTotalForCarType = (float)$thePost['averageTotalForCarType'];
    $assessment->getContent()->maxTotalForCarType = (float)$thePost['maxTotalForCarType'];
    $success = craft()->entries->saveEntry($assessment);

    if( $success ) {
      NegotiatorPlugin::log('Successfully updated offer on-site valuation: ' . $assessment->id , LogLevel::Info);
      $this->returnJson();
    } else {
      NegotiatorPlugin::log('An issue occured when trying to saved a review for Inspection:' . $assessment->id , LogLevel::Info);
      $this->returnErrorJson('An issue occured when trying to saved a review for Inspection'); //if we got here lets return false as it didnt work
    }
  }

  public function actionSavePurchaseHistory() {

    $this->requirePostRequest();
    $thePost = craft()->request->getPost();

    $isAjax = array_key_exists( 'isAjax', $thePost );

    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->id = $thePost['id'];
    $assessment = $criteria->first();

    $thePost['hasCarBeenPurchased'] = array_key_exists( 'hasCarBeenPurchased', $thePost ) ? $thePost['hasCarBeenPurchased'] : 0;

    $assessment->getContent()->hasCarBeenPurchased = $thePost['hasCarBeenPurchased'];
    $assessment->getContent()->purchasePrice = (float) $thePost['purchasePrice'];
    $success = craft()->entries->saveEntry( $assessment );

    if( $success ) {
      NegotiatorPlugin::log("Successfully Saved the purchase history for Inspection:".$assessment->id , LogLevel::Info);
      craft()->userSession->setNotice(Craft::t('Purchased history saved.'));

      if( $isAjax ) {
        $this->returnJson( [ "msg"=>"succsss" ] );
      } else {
        $this->redirectToPostedUrl();
      }

    } else {
      NegotiatorPlugin::log("An issue occured when trying to saved a review for Inspection:".$assessment->id , LogLevel::Info);
      craft()->userSession->setError(Craft::t('Couldn’t save purchase history.'));
      if( $isAjax ) {
        $this->returnErrorJson( [ "msg"=>"failure" ] );
      } else {
        $this->redirectToPostedUrl();
      }
    }
  }

    public function actionContract(array $variables)
    {
        $id = $variables['id'];
        $inspection = craft()->elements->getElementById($id); //used in the included file

        $title = implode(', ', array_filter([$inspection->customerName, $inspection->make, $inspection->model, $inspection->registrationNumber]));

        ob_start();
        require CRAFT_PLUGINS_PATH . 'negotiator/templates/contract_pdf.php';
        $html = ob_get_clean();

        $mpdf = new Mpdf([
            'setAutoTopMargin' => 'stretch',
            'autoMarginPadding' => 20,
        ]);
        $mpdf->showImageErrors = true;
        $mpdf->SetBasePath(CRAFT_PLUGINS_PATH . 'negotiator/templates/');
        $mpdf->WriteHTML($html);
        $mpdf->Output($title . '.pdf', 'I');
    }

    public function actionContractFull(array $variables)
    {
        $id = $variables['id'];
        $inspection = craft()->elements->getElementById($id); //used in the included file
        $title = implode(', ', array_filter([$inspection->customerName, $inspection->make, $inspection->model, $inspection->registrationNumber]));

        ob_start();
        require CRAFT_PLUGINS_PATH . 'negotiator/templates/contract_full_pdf.php';
        $html = ob_get_clean();

        $mpdf = new Mpdf([
            'setAutoTopMargin' => 'stretch',
            'autoMarginPadding' => 20,
        ]);
        $mpdf->showImageErrors = true;
        $mpdf->SetBasePath(CRAFT_PLUGINS_PATH . 'negotiator/templates/');
        $mpdf->WriteHTML($html);
        $mpdf->Output($title . '.pdf', 'I');
    }
}
