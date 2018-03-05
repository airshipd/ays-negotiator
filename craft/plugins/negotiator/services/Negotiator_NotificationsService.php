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

        $client = new NexmoClient(new NexmoCredentials(getenv('NEXMO_API_KEY'), getenv('NEXMO_API_SECRET')));
        try {
            $inspectionDate = $job->inspectionDate->format('j/n/Y');
            $message   = $client->message()->send([
                'to' => $phone,
                'from' => self::FROM,
                'text' => "Hi,
A new job for $inspectionDate has been added to your schedule.
Please get in touch with Jessica (0491367565) if you have any questions.
Thanks",
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
}