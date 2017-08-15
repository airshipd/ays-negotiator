<?php
namespace Craft;

class Negotiator_OfferController extends BaseController {

  protected $allowAnonymous = true;

  public function actionFinalise() {
      $criteria = craft()->elements->getCriteria(ElementType::Entry);
      $criteria->id = craft()->request->getSegment(2);
      $inspection = $criteria->first();
      $action = craft()->request->getSegment(4);

      $template = ( $action == 'accept' ) ? 'offer/accept' : 'offer/reject';
      
      if ( craft()->entries->saveEntry( $inspection ) ) {
         $this->renderTemplate($template);
      } else {
        NegotiatorPlugin::log("Could not save Inspection:".$inspection->id , LogLevel::Info);
        echo 'Something went wrong';
      }
  }

  /* old action finalise from matt */
  // public function actionFinalise() {
  //
  //   $criteria = craft()->elements->getCriteria(ElementType::Entry);
  //   $criteria->id = craft()->request->getSegment(2);
  //   $inspection = $criteria->first();
  //
  //   $action = craft()->request->getSegment(4);
  //   $emailSettings = craft()->globals->getSetByHandle('settings');
  //   $template = ( $action == 'accept' ) ? 'offer/accept' : 'offer/reject';
  //   $emailAddress = ( $action == 'accept' ) ? $emailSettings['acceptEmail'] : $emailSettings['rejectEmail'];
  //   $emailSubject = ( $action == 'accept' ) ? $emailSettings['acceptOfferSubject'] : $emailSettings['rejectOfferSubject'];
  //   $content = $emailSettings['emailContent'];
  //
  //   //lets update the inspection
  //   $inspection->getContent()->inspectionStatus = ( $action == 'accept' ) ? 'Accepted' : 'Rejected';
  //   $inspection->getContent()->offerTotal = craft()->negotiator_offer->calculateOfferTotal($inspection);
  //
  //   if ( craft()->entries->saveEntry( $inspection ) ) {
  //
  //     //lets alert someone of the update to the offer
  //     $email = new EmailModel();
  //     $email->fromEmail = $emailSettings['fromEmail'];
  //     $email->replyTo = $emailSettings['replyToEmail'];
  //     $email->sender = $emailSettings['fromEmail'];
  //     $email->fromName = $emailSettings['senderEmailName'];
  //     $email->toEmail = $emailAddress;
  //     $email->subject = craft()->templates->renderString($emailSubject, array('name' => $inspection->getContent()->customerName ) );
  //     $email->body = craft()->templates->renderString($content, array('name' => $inspection->getContent()->customerName, 'inspectionLink' => $inspection->cpEditUrl));
  //
  //     if (craft()->email->sendEmail($email)) {
  //       $this->renderTemplate($template);
  //     } else {
  //       NegotiatorPlugin::log("Email could not be sent:".$assessment->id , LogLevel::Info);
  //       echo 'Something went wrong';
  //     }
  //   } else {
  //     NegotiatorPlugin::log("Could not save Inspection:".$assessment->id , LogLevel::Info);
  //     echo 'Something went wrong';
  //   }
  // }
}
