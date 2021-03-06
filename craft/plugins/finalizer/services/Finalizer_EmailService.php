<?php

namespace Craft;

class Finalizer_EmailService extends BaseApplicationComponent
{
    const NISSAR_EMAIL = 'nissar@areyouselling.com.au';
    const REPORTS_EMAIL = 'reports@areyouselling.com.au';

    public function sendNotificationEmails($entry)
    {
        // get plugin settings
        $settings = craft()->plugins->getPlugin('finalizer')->getSettings();

        /** Used in templates */
        $staffName = craft()->finalizer_fields->getStaffName($entry);
        $customerName = craft()->finalizer_fields->getCustomerName($entry);
        $contractUrl = craft()->getSiteUrl() . 'contract/' . $entry->id;
        $contractFull = craft()->getSiteUrl() . 'contract-full/' . $entry->id . '/download';

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

        $staffEmailSubject = $settings->staffEmailSubject . ': ' .
            implode(', ', array_filter([$entry->customerName, $entry->make, $entry->model, $entry->registrationNumber]));

        if ($defaultStaffEmail) {
            $this->sendEmail($defaultStaffEmail, $staffEmailSubject, $staffEmailBody);
        }

        $currentUser = craft()->userSession->getUser();
        if ($settings->sendToLoggedInUser == 1 && $currentUser) {
            $this->sendEmail($currentUser->email, $staffEmailSubject, $staffEmailBody);
        }

        $inspectionCreator = $entry->author;
        if ($settings->sendToInspectionCreator = 1 && $inspectionCreator) {
            $this->sendEmail($inspectionCreator->email, $staffEmailSubject, $staffEmailBody);
        }
    }

    public function sendInspectionSubmittedNotification(EntryModel $inspection)
    {
        // get plugin settings
        $settings = craft()->plugins->getPlugin('finalizer')->getSettings();

        // Used in template
        $inspectorName = craft()->finalizer_fields->getInspectorName($inspection);
        $reportUrl = craft()->getSiteUrl() . 'internalrecord/' . $inspection->id;

        $attachments = [];
        $images = new \AppendIterator();
        $images->append($inspection->vehiclePhotos->getIterator());
        $images->append($inspection->licenseAndRegistrationPhotos->getIterator());

        foreach ($images as $image) { /** @var AssetFileModel $image */
            $attachments[] = [
                'path' => $image->getSource()->getSourceType()->getImageSourcePath($image),
                'name' => $image->filename,
                'encoding' => 'base64',
                'type' => $image->getMimeType(),
            ];
        }

        // get email body
        ob_start();
        include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/inspection_submitted.php");
        $emailBody = ob_get_clean();

        if ($settings->negotiatorEmail) {
            $this->sendEmail($settings->negotiatorEmail, 'Inspection Submitted', $emailBody, $attachments);
        }

        if ($settings->carSellerEmail) {
            $this->sendEmail($settings->carSellerEmail, 'Inspection Submitted', $emailBody, $attachments);
        }
        $this->sendEmail(self::REPORTS_EMAIL, 'Inspection Submitted', $emailBody, $attachments);
    }

    public function sendFollowUpNotification(EntryModel $inspection)
    {
        // Used in template
        $sc_email = $inspection->getContent()->salesConsultant;
        if(empty($sc_email) || !filter_var($sc_email, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $car = craft()->finalizer_fields->getCarFullName($inspection);

        //get negotiator name to embed into the template
        $user = craft()->userSession->getUser();
        if($user && $user->isInGroup('negotiators')) {
            $first_line = $user->getFullName() . " has just sent you $car to follow up";
        } else {
            $first_line = "$car has been auto sent to you to follow up";
        }

        // get email body
        ob_start();
        include(CRAFT_PLUGINS_PATH . 'finalizer/templates/email/inspection_follow_up.php');
        $emailBody = ob_get_clean();

        $this->sendEmail($sc_email, 'Inspection for Follow Up', $emailBody);
    }

    public function sendUnassignedJobNotification(EntryModel $inspection)
    {
        $criteria = craft()->elements->getCriteria(ElementType::User);
        $criteria->group = 'sales_consultants';
        $SCs = $criteria->find();

        if(!$SCs) {
            return;
        }

        $emails = array_map(function (UserModel $user) {
            return [
                'name' => $user->getFullName(),
                'email' => $user->email,
            ];
        }, $SCs);

        $car = craft()->finalizer_fields->getCarFullName($inspection);
        $text = "Job: {$inspection->customerName}, $car has been placed into unassigned - grab it whilst it’s hot, it wont last long.";
        $first_recipient = array_shift($emails)['email'];
        $this->sendEmail($first_recipient, 'New Unassigned Job', $text, [], $emails);
    }

    public function sendCustomerContract(EntryModel $inspection)
    {
        // get plugin settings
        $settings = craft()->plugins->getPlugin('finalizer')->getSettings();

        // Used in template
        $customerName = craft()->finalizer_fields->getCustomerName($inspection);
        $contractUrl = craft()->getSiteUrl() . 'app#/contract/' . $inspection->id;

        // get customer email body
        ob_start();
        include(CRAFT_PLUGINS_PATH . "finalizer/templates/email/customer_contract.php");
        $customerEmailBody = ob_get_clean();
        $this->sendEmail($inspection->customerEmail, $settings->customerEmailSubject, $customerEmailBody);
    }

    public function sendNissarUnassignedAlert(EntryModel $inspection)
    {
        $car = craft()->finalizer_fields->getCarFullName($inspection);

        if ($inspection->previousSalesConsultant) {
            $sc = explode('@', $inspection->previousSalesConsultant)[0];
            $sc = ucfirst($sc);
            $prefix = "$sc's job";
        } else {
            $prefix = 'The following job';
        }

        $text = <<<EMAIL
$prefix: {$inspection->customerName}, $car wasn’t checked for 72 hours. 
It became available for other SC’s to follow up and wasn’t followed up for another 72 hours. 
Please re-assign to another SC or follow up yourself to determine whether the lead is dead or alive. Thank you.        
EMAIL;

        $this->sendEmail(self::NISSAR_EMAIL, 'Unassigned Job Not Followed Up For 72 hours', $text);
    }

    public function sendSoldNotification(EntryModel $inspection)
    {
        $settings = craft()->plugins->getPlugin('finalizer')->getSettings();
        if(!$settings->defaultStaffEmail) {
            return;
        }

        $car = craft()->finalizer_fields->getCarFullName($inspection);

        $text = <<<EMAIL
$car, {$inspection->chassisVinNumber} has just been sold for \${$inspection->priceSold}.
Please update Eclipse or contact the seller for more details.
EMAIL;

        $this->sendEmail($settings->defaultStaffEmail, 'Car Sold: ' . $car, $text);
    }

    private function sendEmail($emailTo, $subject, $body, array $attachments = [], $cc = [])
    {
        // send email with the finalized data
        $mail          = new EmailModel();
        $mail->toEmail = $emailTo;
        $mail->subject = $subject;
        $mail->body    = $body;
        $mail->attachments = $attachments;
        $mail->cc = $cc;
        craft()->email->sendEmail($mail);
    }
}
