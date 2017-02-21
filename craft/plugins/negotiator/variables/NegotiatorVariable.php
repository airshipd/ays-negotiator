<?php
namespace Craft;

class NegotiatorVariable {

    public function getOfferDetailsById( $id ) {
        $criteria = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->id = $id;
        $assessment = $criteria->first();
        return craft()->negotiator_assessment->calculateOffer( $assessment );
    }
}
