<?php
namespace Craft;

class Negotiator_AssessmentService extends BaseApplicationComponent {


    public function calculateOffer($assessment) {

      $vehicleAge = $this->calculateVehicleAge( $assessment->getContent()->year);
      $undesirableMake = $this->calculateUndesirableMake( $assessment->getContent()->make );
      $undesirableColour = $this->calculateUndesirableColour( $assessment->getContent()->colour );
      $highKM = $this->calculateHighKM( $assessment->getContent()->odometer  );
      $excessiveRepairs = $this->calculateExcessiveRepairs( $assessment->getContent()->approximateExpenditure  );
      $transmission = $this->calculateTransmission( $assessment->getContent()->transmission  );
      $petrolType = $this->calculatePetrolType( $assessment->getContent()->engineType  );
      $history = $this->calculateHistory( $assessment->getContent()->ownersManual  );
      $wheels = $this->calculateWheels( $assessment->getContent()->wheels  );
      $spareKey = $this->calculateSpareKey( $assessment->getContent()->spareKey  );
      $interior = $this->calculateInterior( $assessment->getContent()->leatherUpholstery  );
      $modifications = $this->calculateModifications( $assessment->getContent()->upgradesMods, $assessment->getContent()->sportsKit  );

      return [
        [
          'title' => 'Vehicle Age',
          'score' => $vehicleAge,
          'description' => 'The demand for newer vehicles is extremely high. There are thousands of new second hand vehicles entering the market everyday. The age of your vehicle has impacted our ability to offer you more for your car.'
        ],
        [
          'title' => 'Undesirable Make',
          'score' =>  $undesirableMake,
          'description' => 'Unfortunately the make and model of your car is not considered to be in high demand. Some makes and models will also depreciate faster than others.'
        ],
        [
          'title' => 'Undesirable Colour',
          'score' => $undesirableColour,
          'description' => 'Although the colour of your car may seem like a small contributing factor, it significantly impacts the value of your car. Generally white, silver and black are considered the most desirable and easiest for us to sell.'
        ],
        [
          'title' => 'High KM',
          'score' => $highKM,
          'description' => 'If there has been a higher number of kilometres over a shorter period of time this will significantly impact the final offer we are able to provide.'
        ],
        [
          'title' => 'Excess Repairs',
          'score' => $excessiveRepairs,
          'description' => 'Although the repairs to your vehicle have been displayed, some damages will effect the final price more than others. '
        ],
        [
          'title' => 'Transmission',
          'score' => $transmission,
          'description' => 'The transmission type of your vehicle will have a significant impact on the amount we can offer you for your car. Manual transmissions are generally considered highly undesirable and harder to sell.'
        ],
        [
          'title' => 'Petrol Type',
          'score' => $petrolType,
          'description' => 'Many new buyers are now actively looking to purchase hybrid or diesel vehicles. This has caused the demand for unleaded vehicles to drop significantly. '
        ],
        [
          'title' => 'History',
          'score' => $history,
          'description' => 'A car without service books means we have no indication of how often the vehicle has been serviced. Cars without a service history significantly impact the how much we can offer you for your car.'
        ],
        [
          'title' => 'Wheels',
          'score' => $wheels,
          'description' => 'Buyers are generally looking for cars with alloy wheels. How much this effects your offer is generally linked to the demand for alloy based on the model and make of your vehicle.'
        ],
        [
          'title' => 'Spare Key',
          'score' => $spareKey,
          'description' => 'If the spare key is missing, we must replace and order the spare key from a verified provider. Keys can vary significantly in cost.'
        ],
        [
          'title' => "Interior",
          'score' => $interior,
          'description' => 'Vehicles that do not have a leather interior are less popular and harder to sell. Leather can also be detailed to make the interior of the vehicle look and feel as new. This is harder to achieve with fabric or suede.'
        ],
        [
          'title' => 'Modifications',
          'score' => $modifications,
          'description' => 'Any modifications and/or upgrades that are non-factory will cause the value of the vehicle to depreciate. There is often a cost required to remove any modifications to reset back to a factory standard.'
        ]
      ];
    }

    private function calculateVehicleAge( $year) {
      $currentYear = date('Y');
      return (($currentYear - $year) > 4) ? true : false;
    }

    private function calculateUndesirableMake($make) {
      $undesirables = ['honda','nissan', 'mazda', 'peugeot', 'holden', 'ford', 'toyota', 'subaru', 'mini'];
      return array_search(strtolower($make),array_map('strtolower', $undesirables)) ? true : false;
    }

    private function calculateUndesirableColour($colour) {
      return $colour === "other" ? true : false;
    }

    private function calculateHighKM($odometer) {
      return $odometer > 50000 ? true : false;
    }

    private function calculateExcessiveRepairs($repairAmount) {
      return $repairAmount > 400 ? true : false;
    }

    private function calculateTransmission($transmission) {
      return $transmission === 'manual' ? true : false;
    }

    private function calculatePetrolType($petrolType) {
      return $petrolType === 500 ? true : false;
    }

    private function calculateHistory($ownersManual) {
      return ! $ownersManual ? true : false;
    }

    private function calculateWheels($wheels) {
      return $wheels === 'hubCaps' ? true : false;
    }

    private function calculateSpareKey($spareKey) {
      return ! $spareKey ? true : false;
    }

    private function calculateInterior($leather) {
      return ! $leather ? true : false;
    }

    private function calculateModifications($upgradeMods, $sportsKit) {
      return $upgradeMods || $sportsKit ? true : false;
    }
}
