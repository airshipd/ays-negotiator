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
    return '1.0.0';
  }

  public function getDeveloper() {
    return 'Matthew Attanasio';
  }

  public function getDeveloperUrl() {
    return 'http://skyfoundry.agency';
  }

  public function hasCpSection() {
    return false;
  }

  protected function defineSettings()
  {
    return array(
      'emailSubject' => array(AttributeType::String, 'default' => "Sales Finalized"),
      'emailTo' => array(AttributeType::String, 'default' => "")
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
      $statusId = $entry['inspectionStatus']->selected;
      // if the status of entry is finalized
      if ($statusId == '3') {
        craft()->finalizer_email->sendNotificationEmail($entry);
      }
    });
  }

}
