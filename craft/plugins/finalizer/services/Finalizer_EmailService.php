<?php
namespace Craft;

class Finalizer_EmailService extends BaseApplicationComponent  {

  public function sendNotificationEmails($entry)
  {
    // get plugin settings
    $settings = craft()->plugins->getPlugin('finalizer')->getSettings();

    $sections = craft()->finalizer_fields->groupFieldsByTabs($entry);

    $images = $entry->licenseAndRegistrationPhotos;
    $image_urls = array();

    foreach($images as $image) {
      array_push($image_urls, craft()->assets->getUrlForFile($image));
    }

    $contractUrl = craft()->getSiteUrl() . 'contract/' . $entry->id;

    // get customer email body
    ob_start();
    include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/customerNotification.php");
    $customerEmailBody =  ob_get_clean();
    $this->sendEmail($entry->customerEmail, $settings->customerEmailSubject, $customerEmailBody);

    // get staff email body
    ob_start();
    include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/staffNotification.php");
    $staffEmailBody =  ob_get_clean();

    $defaultStaffEmail = $settings->defaultStaffEmail;

    if($defaultStaffEmail !== '') {
      $this->sendEmail($defaultStaffEmail, $settings->staffEmailSubject, $staffEmailBody);
    }

    if ($settings->sendToLoggedInUser == 1) {
      $currentUser = craft()->userSession->getUser();
      $this->sendEmail($currentUser->email, $settings->staffEmailSubject, $staffEmailBody);
    }


    if ($settings->sendToInspectionCreator = 1) {
        $this->sendEmail($entry->author->email, $settings->staffEmailSubject, $staffEmailBody);
    }

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
}
