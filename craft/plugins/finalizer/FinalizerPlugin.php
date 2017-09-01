<?php
namespace Craft;

class FinalizerPlugin extends BasePlugin {

  public function getName() {
    return Craft::t('Finalizer');
  }

  public function getDescription() {
    return '';
  }

  public function getVersion() {
    return '1.1.0';
  }

  public function getDeveloper() {
    return 'Jerry Chai';
  }

  public function getDeveloperUrl() {
    return 'https://github.com/jchai002';
  }

  public function hasCpSection() {
    return false;
  }

  protected function defineSettings()
  {
    return array(
      'staffEmailSubject' => array(AttributeType::String, 'default' => "Order Finalized"),
      'customerEmailSubject' => array(AttributeType::String, 'default' => "Thank You for Using Are You Selling"),
      'defaultStaffEmail' => array(AttributeType::String, 'default' => ""),
      'sendToLoggedInUser' => array(AttributeType::Bool, 'default' => 1),
      'sendToInspectionCreator' => array(AttributeType::Bool, 'default' => 0)
    );
  }

  public function getSettingsHtml()
  {
    return craft()->templates->render('finalizer/settings', array(
      'settings' => $this->getSettings()
    ));
  }

  public function init() {
    //Event: onSaveEntry
    craft()->on('entries.saveEntry', function(Event $event) {
      $entry = $event->params['entry'];
      if ($entry['inspectionStatus'] == 'finalized') {    craft()->finalizer_email->sendNotificationEmails($entry);
      }
    });
  }

}
