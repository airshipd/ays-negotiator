<?php
namespace Craft;

class Negotiator_AssessmentService extends BaseApplicationComponent {


    /************
      Returns the calculated scores based on the assessment form provided by the mechanic
      Scores are assigned in the following way
      A > 95%
      B > 60%
      C > 30%
      D > 0%
    ************/
    public function calculateOffer($assessment) {

      $scoreMake = $this->calculateMakeScore( $assessment->getContent()->year, $assessment->getContent()->transmission, $assessment->getContent()->colour, $assessment->getContent()->engineType  );
      $scoreCondition = $this->calculateCondition( $assessment->getContent->odometer, $assessment->getContent->spareKey, $assessment->getContent->approximateExpenditure  );
      $scoreHistory = $this->calculateHistory( $assessment->getContent()->ownersManual );

      return [
        'scoreMake' => $scoreMake,
        'scoreCondition' => $scoreCondition,
        'scoreHistory' => $scoreHistory,
        'scoreExtras' => 'B'
      ];
    }

    private function calculateMakeScore( $year, $transmission, $colour, $fuelType ) {

      //setup default weightings
      $yearCalc = 0;
      $transmissionCalc = 0;
      $colourCalc = 0;
      $fuelCalc = 0;

      //Year ((x+1)/(x+1)^1.3) | x = age in years
      $age = date('Y') - $year;
      $yearCalc = ($age + 1) / ( pow( ( $age + 1 ), 1.3) );

      //Transmission (Auto = 1 or Manual = 0)
      $transmissionCalc = ($transmission == 'auto' ? 1 : 0 );

      //Color (Silver, Black, Grey, White = 1 or Else = 0)
      switch( $colour ) {
        case 'silver':
          $colorCalc = 1;
          break;
        case 'black':
          $colorCalc = 1;
          break;
        case 'grey':
          $colorCalc = 1;
          break;
        case 'white':
          $colorCalc = 1;
          break;
        default:
          $colorCalc = 0;
      }

      //Fuel Type (Petrol = 0 or Gas = 0.5 or Diesel = 1)
      switch( $fuelType ) {
        case 'petrol':
          $fuelCalc = 0;
          break;
        case 'gas':
          $fuelCalc = 0.5;
          break;
        case 'diesel':
          $fuelCalc = 1;
          break;
        default:
          $fuelCalc = 0;
      }

      return $this->determineScoreCharacter( round($yearCalc, 0, PHP_ROUND_HALF_DOWN) + $transmissionCalc + $colourCalc + $fuelCalc );
    }


    private function calculateCondition( $odometer, $spareKey, $spend ) {
      //setup default weightings
      $odometerCalc;
      $spareKeyCalc;
      $spendCalc;

      //Odomter  1 - (x^1.05/250^1.05)
      $odometerCalc = 1 - ( pow( $odometer, 1.05) / pow( 250, 1.05) );

      //Spare key Yes = 1 or No = 0
      $spareKeyCalc = $spareKey;

      //Spend Less than $750 = 1 or More/equal than $750 = 0
      $spendCalc = ( $spend < 750 ? 1 : 0 );

      return $this->determineScoreCharacter( round($odometerCalc, 0, PHP_ROUND_HALF_DOWN) + $spareKeyCalc + $spendCalc );
    }


    private function calculateHistory( $ownersManual ) {

      return $this->determineScoreCharacter( $ownersManual * 10 );
    }

    private function calculateExtras() {

    }


    private function determineScoreCharacter( $score ) {

      if( $score > 9.5 ) {
        return "A";
      }

      if( $score > 6 ) {
        return "B";
      }

      if( $score > 3 ) {
        return "C";
      }

      if( $score > 0 ) {
        return "D";
      }

      if( $score < 0 ) {
        return "F";
      }
    }
}
