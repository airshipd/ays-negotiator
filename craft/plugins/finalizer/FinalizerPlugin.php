<?php

namespace Craft;

class FinalizerPlugin extends BasePlugin
{

    public function getName()
    {
        return Craft::t('Finalizer');
    }

    public function getDescription()
    {
        return '';
    }

    public function getVersion()
    {
        return '1.1.0';
    }

    public function getDeveloper()
    {
        return 'Jerry Chai';
    }

    public function getDeveloperUrl()
    {
        return 'https://github.com/jchai002';
    }

    public function hasCpSection()
    {
        return false;
    }

    protected function defineSettings()
    {
        return [
            'staffEmailSubject'       => [AttributeType::String, 'default' => 'Order Finalized'],
            'customerEmailSubject'    => [AttributeType::String, 'default' => 'Thank You for Using Are You Selling'],
            'defaultStaffEmail'       => [AttributeType::Email, 'default' => ''],
            'negotiatorEmail'         => [AttributeType::Email, 'default' => ''],
            'carSellerEmail'          => [AttributeType::Email, 'default' => ''],
            'sendToLoggedInUser'      => [AttributeType::Bool, 'default' => 1],
            'sendToInspectionCreator' => [AttributeType::Bool, 'default' => 0],
        ];
    }

    public function getSettingsHtml()
    {
        return craft()->templates->render('finalizer/settings', [
            'settings' => $this->getSettings(),
        ]);
    }

    public function init()
    {
        $old_status = '';
        craft()->on('entries.BeforeSaveEntry', function (Event $event) use(&$old_status) {
            /** @var EntryModel $entry */
            $entry = $event->params['entry'];

            $isInspectionEntry      = $entry->section->handle === 'inspections';
            $isNewEntry             = $event->params['isNewEntry'];

            if ($isInspectionEntry && !$isNewEntry) {
                //get previous status value
                $criteria = craft()->elements->getCriteria(ElementType::Entry);
                $criteria->id = $entry->id;
                $old_entry = $criteria->first();
                $old_status = (string)$old_entry->inspectionStatus;
            }

            return $event->performAction = true;
        });


        craft()->on('entries.saveEntry', function (Event $event) use(&$old_status) {
            $entry = $event->params['entry'];
            $isInspection = $entry->section->handle === 'inspections';
            if ($isInspection) {
                $status = (string)$entry->getContent()->inspectionStatus;

                if ($status === 'finalized') {
                    craft()->finalizer_email->sendNotificationEmails($entry);
                }

                if ($old_status && $old_status !== $status && $status === 'Unopened') {
                    craft()->finalizer_email->sendCustomerContract($entry);
                }
            }
        });

        craft()->on('negotiator_notifications.submitted', function (Event $event) {
            $inspection = $event->params['inspection'];
            craft()->finalizer_email->sendInspectionSubmittedNotification($inspection);
        });
    }
}
