<?php
namespace Craft;

class Negotiator_OfferService extends BaseApplicationComponent {

  public function calculateOfferTotal( $assessment ) {
    if($assessment->getContent()->reviewPrice) {
      $total = $assessment->getContent()->reviewValuation - $assessment->getContent()->approximateExpenditure;
    } else {
      $total = $assessment->getContent()->onsitePhysicalValuation - $assessment->getContent()->approximateExpenditure;
    }

    return $total;
  }
}
