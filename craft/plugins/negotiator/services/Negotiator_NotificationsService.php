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
        if(empty($inspector->phone)) {
            return;
        }

        $phone = preg_replace('/^0/', 61, $inspector->phone);

        $client = new NexmoClient(new NexmoCredentials(getenv('NEXMO_API_KEY'), getenv('NEXMO_API_SECRET')));
        try {
            $posted_at = $job->postDate->format('j/n/Y');
            $message   = $client->message()->send([
                'to' => $phone,
                'from' => self::FROM,
                'text' => "Hi,
    A new job for $posted_at has been posted for you to review!
    Please get in touch and organise a time to inspect their vehicle.
    Thanks",
            ]);
        } catch (NexmoClient\Exception\Exception $e) {
            craft::log('SMS notification to inspector failed: ' . $e->getMessage(), LogLevel::Error, false, 'application', 'negotiator');
            return;
        }

        if(!empty($message['status'])) {
            craft::log('SMS notification to inspector failed: ' . $message['error-text'], LogLevel::Error, false, 'application', 'negotiator');
        } else {
            craft::log('SMS has been sent successfully: ' . json_encode((array)$message), LogLevel::Info, false, 'application', 'negotiator');
        }
    }
}