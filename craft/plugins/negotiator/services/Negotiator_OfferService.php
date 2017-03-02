<?php
namespace Craft;

class Negotiator_OfferService extends BaseApplicationComponent {

  public function calculateOfferTotal( $assessment ) {

    $total = 0;

    if( ! empty( $assessment->getContent()->reviewPrice) || $assessment->getContent()->reviewPrice != 0 ) {
      $total = $assessment->getContent()->reviewValuation - $assessment->getContent()->approximateExpenditure;
    } else {
      $total = $assessment->getContent()->onsitePhysicalValuation - $assessment->getContent()->approximateExpenditure;
    }

    return $total;
  }
}
