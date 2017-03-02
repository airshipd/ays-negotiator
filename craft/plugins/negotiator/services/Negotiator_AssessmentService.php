<?php
namespace Craft;

class Negotiator_AssessmentService extends BaseApplicationComponent {

    public $weightHigh = 3;
    public $weightMedium = 2;
    public $weightLow = 1;

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
      $scoreCondition = $this->calculateCondition( $assessment->getContent()->odometer, $assessment->getContent()->spareKey, $assessment->getContent()->approximateExpenditure  );
      $scoreHistory = $this->calculateHistory( $assessment->getContent()->ownersManual );
      $scoreExtra = $this->calculateExtras(  $assessment->getContent()->sunroof, $assessment->getContent()->satNav, $assessment->getContent()->tradesmanExtras, $assessment->getContent()->sportsKit, $assessment->getContent()->leatherUpholstery, $assessment->getContent()->wheels, $assessment->getContent()->upgradesMods );

      return [
        'scoreMake' => $scoreMake,
        'scoreCondition' => $scoreCondition,
        'scoreHistory' => $scoreHistory,
        'scoreExtras' => $scoreExtra
      ];
    }

    private function calculateMakeScore( $year, $transmission, $colour, $fuelType ) {

      //setup default for calc variables
      $yearCalc = 0;
      $transmissionCalc = 0;
      $colourCalc = 0;
      $fuelCalc = 0;
      $age = date('Y') - $year;

      //Year ((x+1)/(x+1)^1.3) | x = age in years
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

      //Add all weighted variables and divide by total points to get the percentage in this case its 10
      $weightedPercentage = ( round( $yearCalc * $this->weightHigh, 0, PHP_ROUND_HALF_DOWN )
                            + ( $transmissionCalc * $this->weightHigh )
                            + ( $colorCalc * $this->weightMedium )
                            + ( $fuelCalc * $this->weightMedium ) ) / 10;

      return [
        'score' => $this->determineScoreCharacter( $weightedPercentage ),
        'yearCalc' => $this->individualVariableScore( $yearCalc ),
        'transmissionCalc' => $this->individualVariableScore( $transmissionCalc ),
        'colorCalc' => $this->individualVariableScore( $colorCalc ),
        'fuelCalc' => $this->individualVariableScore( $fuelCalc )
      ];
    }


    private function calculateCondition( $odometer, $spareKey, $spend ) {

      //setup default weightings
      $odometerCalc = 0;
      $spareKeyCalc = 0;
      $spendCalc = 0;

      //Odomter  1 - (x^1.05/250000^1.05)
      $odometerCalc = 1 - ( pow( $odometer, 1.05) / pow( 250000, 1.05) );

      //Spare key Yes = 1 or No = 0
      $spareKeyCalc = $spareKey;

      //Spend Less than $750 = 1 or More/equal than $750 = 0
      $spendCalc = ( $spend < 750 ? 1 : 0 );

      //Add all weighted variables and divide by total points to get the percentage in this case its 6
      $weightedPercentage = ( round( $odometerCalc * $this->weightHigh, 0, PHP_ROUND_HALF_DOWN )
                            + ( $spareKeyCalc * $this->weightLow )
                            + ( $spendCalc * $this->weightMedium ) ) / 6;

      return [
        'score' => $this->determineScoreCharacter( $weightedPercentage ),
        'odometerCalc' => $this->individualVariableScore( $odometerCalc ),
        'spareKeyCalc' => $this->individualVariableScore( $spareKeyCalc ),
        'spendCalc' => $this->individualVariableScore( $spendCalc )
      ];
    }


    private function calculateHistory( $ownersManual ) {

      return [
        'score' => $this->determineScoreCharacter( $ownersManual ),
        'ownerManualCalc' => $this->individualVariableScore( $ownersManual )
      ];
    }

    private function calculateExtras( $sunRoof, $satNav, $tradeExtras, $sportsKit, $leather, $wheels, $upgradesMods ) {

      //Add all weighted variables and divide by total points to get the percentage in this case its 6
      $weightedPercentage = ( ( $sunRoof * $this->weightMedium )
                            + ( $satNav * $this->weightMedium )
                            + ( $tradeExtras * $this->weightLow )
                            + ( $sportsKit * $this->weightHigh )
                            + ( $leather * $this->weightHigh )
                            + ( $wheels * $this->weightHigh ) ) / 14;

      // if there are upgrades and mods we override the percentage as a 0
      if ( $upgradesMods == 1 ) {
        $weightedPercentage = 0;
      }

      return [
        'score' => $this->determineScoreCharacter( $weightedPercentage ),
        'sunRoofCalc' => (int)$sunRoof,
        'satNavCalc' => (int)$satNav,
        'tradeExtrasCalc' => (int)$tradeExtras,
        'sportsKitCalc' => (int)$sportsKit,
        'leatherCalc' => (int)$leather,
        'wheelsCalc' => ( $wheels == 'alloys' ? 1 : 0 ),
        'upgradesModsCalc' => ( $upgradesMods == 1 ? 0 : 1 ) ,
      ];
    }


    private function determineScoreCharacter( $score ) {

      if( $score > 0.95 ) {
        return "A";
      }

      if( $score > 0.6 ) {
        return "B";
      }

      if( $score > 0.3 ) {
        return "C";
      }

      if( $score > 0 or $score == 0 ) {
        return "D";
      }

      if( $score < 0 ) {
        return "F";
      }
    }

    private function individualVariableScore( $score ) {

      if( $score > 0.6 ) {
        return 1;
      } else {
        return 0;
      }
    }
}
