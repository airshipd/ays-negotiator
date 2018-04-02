<?php
namespace Craft;

class Negotiator_ApiController extends BaseController {

  protected $allowAnonymous = true;

  public function actionInspections()
  {
      $user = craft()->userSession->getUser();
      $isNegotiator = $user->isInGroup('negotiators');
      $isSales = $user->isInGroup('sales_consultants');

      $upcoming = craft()->request->getQuery('upcoming', false);
      $rejected = craft()->request->getQuery('rejected', false);
      $unsuccessful = craft()->request->getQuery('unsuccessful', false);

      $criteria = craft()->elements->getCriteria(ElementType::Entry);
      $criteria->limit = null;
      $criteria->section = 'inspections';
      if (!$user->admin && !$isNegotiator && !($isSales && $unsuccessful)) {
          $criteria->relatedTo = [
              'targetElement' => $user,
              'field'         => 'inspector',
          ];
      }

      if($state = craft()->request->getQuery('state')) {
          if($state === 'nt_sa') {
              $state = 'or,nt,sa';
          }

          $criteria->customerState = $state;
      }

      $criteria->order = 'inspectionDate, dateCreated asc';

      if($upcoming || $rejected) {
          $date = craft()->request->getQuery('date');
          if (!$date && !$isSales && !$isNegotiator) {
              $date = date('Y-m-d');
          }

          if($date) {
              //Validate "date". It can't be more than 7 days in the future and it can't be more than 30 days in the past
              $now = new DateTime(date('Y-m-d')); //don't remove date() parameter. Otherwise it will take h:m:s into account and calculate wrong results
              $dateObject = new DateTime($date);
              $interval = $dateObject->diff($now);
              $diff_days = $interval->format('%r%a');

              if($diff_days < -7 || $diff_days > 30) {
                  $dateObject = $now;
              }

              $criteria->inspectionDate = 'and,>=' . $dateObject->format('Y-m-d') . ',<' . $dateObject->add(new \DateInterval('P1D'));
          } elseif($upcoming) {
              $criteria->inspectionDate = ':notempty:';
          }

          if($upcoming) {
              $criteria->inspectionStatus = 'UpComing';
              $criteria->rescheduled = 0;
          } else {
              $criteria->inspectionStatus = 'Rejected';
          }

      } elseif ($unsuccessful) {
          $criteria->inspectionStatus = 'Unsuccessful';
      } else {
        //Pending
          $criteria->runbikestopId = ':notempty:';

          $dbCommand = craft()->elements->buildElementsQuery($criteria);
          $dbCommand->andWhere('field_inspectionDate IS NULL OR field_rescheduled = 1');
      }

      if(isset($dbCommand)) {
          $inspections = EntryModel::populateModels($dbCommand->queryAll());
      } else {
          $inspections = $criteria->find();
      }

      //build out response object
      $result = [];
      foreach ($inspections as $i) {
          if($i->location->parts) {
              $parts = $i->location->parts + ['route_short' => '', 'locality' => '']; //sometimes necessary fields may be absent
              $address = trim($parts['route_short'] . ' ' . $parts['locality']) ?: 'TBC';
          } else {
              $address = 'TBC';
          }

          $result[] = [
              'id'      => $i->id,
              'lat'     => $i->location->lat ? floatval($i->location->lat) : null,
              'lng'     => $i->location->lng ? floatval($i->location->lng) : null,
              'zoom'    => intval($i->location->zoom),
              'address' => $address,
              'title'   => $i->year . ' ' . $i->make . ' ' . $i->model . ' ' . $i->badge,
              'status'  => $i->getContent()->inspectionStatus,
              'url'     => $i->url,
              'pending' => !$i->inspectionDate || $i->rescheduled,
              'rescheduled' => $i->rescheduled,
              'driveIn' => $i->driveIn,
              'localMech' => $i->localMech,
              'inspectionDate' => $i->inspectionDate ? $i->inspectionDate->format('Y-m-d H:i:s') : null,
          ];
      }

      $this->returnJson($result);
  }

  public function actionInspection(array $variables = [])
  {
      $criteria     = craft()->elements->getCriteria(ElementType::Entry);
      $criteria->id = $variables['id'];
      $inspection   = $criteria->first();

      $this->returnJson([
          'data' => $this->_processFieldData($inspection),
          'options' => $this->_processOptionData($inspection),
      ]);
  }

  public function actionInspectors()
  {
      $criteria = craft()->elements->getCriteria(ElementType::User);
      $criteria->group = 'inspectors';
      $criteria->order = 'firstName, lastName, email';

      $users = $criteria->find();
      $result = [];
      foreach($users as $user) {
          $result[] = $this->_apifyUser($user);
      }

      $this->returnJson($result);
  }

  public function actionOffer(array $variables = [])
  {
      $criteria     = craft()->elements->getCriteria(ElementType::Entry);
      $criteria->id = $variables['id'];
      $inspection   = $criteria->first();

      $this->returnJson([
          'data'    => $this->_processFieldData($inspection),
          'options' => $this->_processOptionData($inspection),
          'report'  => craft()->negotiator_assessment->calculateOffer($inspection),
          'total'   => craft()->negotiator_offer->calculateOfferTotal($inspection),
      ]);
  }

  public function actionFinalise() {
    $criteria = craft()->elements->getCriteria(ElementType::Entry);
    $criteria->id = craft()->request->getSegment(3);
    $inspection = $criteria->first();
    $action = craft()->request->getSegment(3);
    $ret = [];

    // set inspection status
    $inspection->getContent()->inspectionStatus = ( $action == 'accept' ) ? 'Accepted' : 'Rejected';
    if ( craft()->entries->saveEntry( $inspection ) ) {
      $ret['status'] = "OK";
      $this->returnJson($ret);
    } else {
      $this->returnErrorJson("Could not save Inspection");
      NegotiatorPlugin::log("Could not save Inspection:".$inspection->id , LogLevel::Info);
    }
  }

  public function actionGetContract() {
    $settings = craft()->globals->getSetByHandle('settings');
    $this->returnJson(['content'=>(string) $settings->contractCopy]);
  }

  public function actionSubmitContract(array $variables = [])
  {
      $criteria     = craft()->elements->getCriteria(ElementType::Entry);
      $criteria->id = $variables['id'];
      $inspection   = $criteria->first();

      if(!$inspection) {
          throw new HttpException(404);
      }

      if (!in_array($inspection->inspectionStatus, ['Unopened', 'Opened'])) {
          throw new HttpException(403);
      }

      $post = json_decode(craft()->request->getRawBody(), true);
      $inspection->setContentFromPost([
          'customerName' => $post['customerName'],
          'customerSignatureString' => $post['customerSignatureString'],
          'inspectionStatus' => 'finalized',
      ]);

      craft()->entries->saveEntry($inspection);
  }

  public function actionSetOpened(array $variables = [])
  {
      $criteria     = craft()->elements->getCriteria(ElementType::Entry);
      $criteria->id = $variables['id'];
      $inspection   = $criteria->first();

      if(!$inspection) {
          throw new HttpException(404);
      }

      if ($inspection->inspectionStatus == 'Opened') {
          return;
      }

      if ($inspection->inspectionStatus != 'Unopened') {
          throw new HttpException(403);
      }

      $inspection->setContentFromPost(['inspectionStatus' => 'Opened']);
      craft()->entries->saveEntry($inspection);
  }


    private function _processFieldData(BaseElementModel $inspection)
    {
        $ret = [];

        foreach ($inspection->getFieldLayout()->getFields() as $fieldLayoutField) {
            $field = $fieldLayoutField->getField();
            $fieldName = $field->handle;

            switch ($field->type) {
              case 'Users':
                $ret[$fieldName] = $inspection->$fieldName->ids();

                if($ret[$fieldName]) {
                    $user = craft()->users->getUserById($ret[$fieldName][0]);
                    $ret[$fieldName . '_details'] = $this->_apifyUser($user);
                }
                break;
              case 'Date':
                $value           = $inspection->$fieldName !== null ? $inspection->$fieldName->format('d/m/Y') : null;
                $ret[$fieldName] = $value;
                break;
              case 'Assets':
                $ret[$fieldName] = [];
                foreach($inspection->$fieldName as $asset) { /** @var AssetFileModel $asset */
                    $ret[$fieldName][] = [
                        'id' => $asset->id,
                        'url' => $asset->getUrl(),
                    ];
                }
                break;
              default:
                $ret[$fieldName] = $inspection->getContent()->$fieldName;
            }
        }

        return $ret;
    }

    private function _apifyUser(UserModel $user)
    {
        return [
            'id' => $user->id,
            'firstName' => $user->firstName,
            'lastName' => $user->lastName,
            'email' => $user->email,
        ];
    }

    private function _processOptionData(BaseElementModel $inspection)
    {
        $ret = [];

        foreach ($inspection->getFieldLayout()->getFields() as $fieldLayoutField) {
            $field = $fieldLayoutField->getField();

            $fieldName     = $field->handle;
            $fieldType     = $field->type;
            $fieldSettings = $field->settings;

            $ret[$fieldName] = [
                'type'     => $fieldType,
                'settings' => $fieldSettings,
            ];
        }
        return $ret;
    }

    public function actionSubmitInspection(array $variables = [])
    {
        $criteria     = craft()->elements->getCriteria(ElementType::Entry);
        $criteria->id = $variables['id'];
        $inspection   = $criteria->first();

        if(!$inspection) {
            throw new HttpException(404);
        }

        craft()->negotiator_notifications->onSubmitted(new Event(null, ['inspection' => $inspection]));
    }
}
