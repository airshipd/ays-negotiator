<?php

namespace Craft;

use Nexmo\Client as NexmoClient;
use Nexmo\Client\Credentials\Basic as NexmoCredentials;

class Negotiator_NotificationsService extends BaseApplicationComponent
{
    const FROM = 'MoneyForCar';

    /**
     * Send SMS notification to inspector
     *
     * @param UserModel  $inspector
     * @param EntryModel $job
     */
    public function notifyInspector(UserModel $inspector, EntryModel $job)
    {
        if(empty($inspector->phone) || empty($job->inspectionDate)) {
            return;
        }

        $phone = preg_replace('/^0/', 61, $inspector->phone);
        $inspectionDate = $job->inspectionDate->format('j/n/Y');
        $text    = "Hi,
A new job for $inspectionDate has been added to your schedule.
Please get in touch with Jessica (0491367565) if you have any questions.
Thanks";

        if(!craft()->config->get('enableSMS')) {
            craft::log("SMS disabled. SMS to inspector isn't sent. Job#{$job->id}. Phone: $phone. Message: $text", LogLevel::Info, false, 'application', 'negotiator');
            return;
        }

        $client = new NexmoClient(new NexmoCredentials(getenv('NEXMO_API_KEY'), getenv('NEXMO_API_SECRET')));
        try {
            $message = $client->message()->send([
                'to' => $phone,
                'from' => self::FROM,
                'text' => $text,
            ]);
        } catch (NexmoClient\Exception\Exception $e) {
            craft::log('SMS notification to inspector failed: ' . $e->getMessage(), LogLevel::Error, false, 'application', 'negotiator');
            return;
        }

        if(!empty($message['status'])) {
            craft::log('SMS notification to inspector failed: ' . $message['error-text'], LogLevel::Error, false, 'application', 'negotiator');
        } else {
            craft::log(sprintf('SMS has been sent successfully. Inspector #%d. Entry #%d', $inspector->id, $job->id), LogLevel::Info, false, 'application', 'negotiator');
        }
    }

    /**
     * Send SMS notification to customer
     *
     * @param UserModel  $inspector
     * @param EntryModel $job
     */
    public function notifyCustomer(UserModel $inspector, EntryModel $job)
    {
        if(empty($job->customerMobileNumber) && empty($job->customerPhoneNumber) || empty($job->inspectionDate)) {
            return;
        }

        $phone = $job->customerMobileNumber ?: $job->customerPhoneNumber;
        if(!preg_match('/^0[45]\d{8}$/', $phone)) {
            craft::log("SMS notification to customer failed: wrong phone number format. Job ID#{$job->id}. Phone: $phone.", LogLevel::Warning, false, 'application', 'negotiator');
            return;
        }

        $phone = preg_replace('/^0/', 61, $phone);

        $customerName = $job->customerName ? ' ' . $job->customerName : '';
        $inspectionDate = $job->inspectionDate->format('j/n/Y g:m A');
        $inspectorName = $inspector->getFullName();
        $text = "Hi$customerName,
Our inspector, $inspectorName, has been booked in to inspect your vehicle on $inspectionDate.
We look forward to giving you a great offer for your car!
Thanks,
Are You Selling";

        if(!craft()->config->get('enableSMS')) {
            craft::log("SMS disabled. SMS to customer isn't sent. Job#{$job->id}. Phone: $phone. Message: $text", LogLevel::Info, false, 'application', 'negotiator');
            return;
        }

        $client = new NexmoClient(new NexmoCredentials(getenv('NEXMO_API_KEY'), getenv('NEXMO_API_SECRET')));
        try {
            $message = $client->message()->send([
                'to' => $phone,
                'from' => self::FROM,
                'text' => $text,
            ]);
        } catch (NexmoClient\Exception\Exception $e) {
            craft::log('SMS notification to customer failed: ' . $e->getMessage(), LogLevel::Error, false, 'application', 'negotiator');
            return;
        }

        if(!empty($message['status'])) {
            craft::log('SMS notification to customer failed: ' . $message['error-text'], LogLevel::Error, false, 'application', 'negotiator');
        } else {
            craft::log(sprintf('SMS has been sent successfully. Inspector #%d. Entry #%d', $inspector->id, $job->id), LogLevel::Info, false, 'application', 'negotiator');
        }
    }

    /**
     * Fires an 'onSubmitted' event - when inspector clicks "Submit" or "Skip to paperwork" at Pre-Inspection Form
     *
     * @param Event $event
     */
    public function onSubmitted(Event $event)
    {
        $this->raiseEvent('onSubmitted', $event);
    }
}