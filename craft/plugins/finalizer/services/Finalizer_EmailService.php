<?php
namespace Craft;

class Finalizer_EmailService extends BaseApplicationComponent  {

  public function sendNotificationEmail($entry)
  {
    $sections = $this->groupFieldsByTabs($entry);
    ob_start();
    include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/notification.php");
    $body =  ob_get_clean();

    // send email with the finalized data

    // $mail = new EmailModel();
    // $mail->toEmail = 'jchai002@gmail.com';
    // $mail->subject = 'test';
    // $mail->body    = $body;
    // craft()->email->sendEmail($mail);

    echo $body;
    // echo "<pre>";print_r($sections);echo "</pre>";
    exit;die;
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

    return $grouped;
  }
}
