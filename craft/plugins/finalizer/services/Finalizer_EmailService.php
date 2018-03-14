<?php

namespace Craft;

class Finalizer_EmailService extends BaseApplicationComponent
{
    public function sendNotificationEmails($entry)
    {
        // get plugin settings
        $settings = craft()->plugins->getPlugin('finalizer')->getSettings();

        /** Used in templates */
        $staffName = craft()->finalizer_fields->getStaffName($entry);
        $customerName = craft()->finalizer_fields->getCustomerName($entry);
        $contractUrl = craft()->getSiteUrl() . 'contract/' . $entry->id;
        $recordUrl = craft()->getSiteUrl() . 'internalrecord/' . $entry->id;

        $images     = $entry->licenseAndRegistrationPhotos;
        $image_urls = [];

        foreach ($images as $image) {
            array_push($image_urls, craft()->assets->getUrlForFile($image));
        }

        // get customer email body
        ob_start();
        include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/customerNotification.php");
        $customerEmailBody = ob_get_clean();
        $this->sendEmail($entry->customerEmail, $settings->customerEmailSubject, $customerEmailBody);

        // get staff email body
        ob_start();
        include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/staffNotification.php");
        $staffEmailBody = ob_get_clean();

        $defaultStaffEmail = $settings->defaultStaffEmail;

        if ($defaultStaffEmail) {
            $this->sendEmail($defaultStaffEmail, $settings->staffEmailSubject, $staffEmailBody);
        }

        $currentUser = craft()->userSession->getUser();
        if ($settings->sendToLoggedInUser == 1 && $currentUser) {
            $this->sendEmail($currentUser->email, $settings->staffEmailSubject, $staffEmailBody);
        }

        $inspectionCreator = $entry->author;
        if ($settings->sendToInspectionCreator = 1 && $inspectionCreator) {
            $this->sendEmail($inspectionCreator->email, $settings->staffEmailSubject, $staffEmailBody);
        }
    }

    private function sendEmail($emailTo, $subject, $body)
    {
        // send email with the finalized data
        $mail          = new EmailModel();
        $mail->toEmail = $emailTo;
        $mail->subject = $subject;
        $mail->body    = $body;
        craft()->email->sendEmail($mail);
    }
}
