<?php
namespace Craft;

class Finalizer_EmailService extends BaseApplicationComponent  {

  public function sendNotificationEmails($entry)
  {
    // get plugin settings
    $settings = craft()->plugins->getPlugin('finalizer')->getSettings();
    $sections = $this->groupFieldsByTabs($entry);
    $images = $entry->vehicleImages;
    $image_urls = array();

    foreach($images as $image) {
      array_push($image_urls, craft()->assets->getUrlForFile($image));
    }

    $contractUrl = craft()->getSiteUrl() . 'contract/' . $entry->id;

    ob_start();
    include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/customerNotification.php");
    $customerEmailBody =  ob_get_clean();
    $this->sendEmail($entry->customerEmail, $settings->customerEmailSubject, $customerEmailBody);


    ob_start();
    include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/staffNotification.php");
    $staffEmailBody =  ob_get_clean();
    $this->sendEmail($entry->author->email, $settings->staffEmailSubject, $staffEmailBody);

    // echo'<pre>';print_r($customerEmailBody);echo'</pre>';
    // echo'<pre>';print_r($contractUrl);echo'</pre>';
    // exit;die;
  }

  private function sendEmail($emailTo, $subject, $body) {
    // send email with the finalized data
    $mail = new EmailModel();
    $mail->toEmail = $emailTo;
    $mail->subject = $subject;
    $mail->body    = $body;
    craft()->email->sendEmail($mail);
  }

  private function groupFieldsByTabs($entry) {
    $tabs = $entry->getFieldLayout()->getTabs();
    $entryFieldValues = $entry->getContent()->getAttributes();
    $grouped = array();

    forEach ($tabs as $tab) {
      $tabContent = array();
      $fields = $tab->getFields();
      foreach ($fields as $field) {
        $field = $field->getField();
        $fieldHandle = $field['handle'];
        $fieldName = $field['name'];
        $fieldValue = $entryFieldValues[$fieldHandle];
        if (is_a($fieldValue, 'DateTime')) {
          $fieldValue = $fieldValue->format('d/M/Y');
        }
        $tabContent[$fieldName] = $fieldValue;
      }
      $grouped[$tab['name']] = $tabContent;
    }

    // remove fields that we don't want to show up in the final email
    unset($grouped["Car Details"]["Vehicle Images"]);
    unset($grouped["Pre Inspection Details"]["Mechanic"]);
    unset($grouped["Pre Inspection Details"]["Inspection Status"]);
    return $grouped;
  }
}
