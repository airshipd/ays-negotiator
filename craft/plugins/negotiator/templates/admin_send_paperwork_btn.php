<?php
/**
 * @var \Craft\EntryModel $inspection
 */

if($inspection->inspectionStatus == 'Unopened') {
    return;
}
?>
<a href="#" class="btn send-paperwork">Send for Paperwork</a>

<?php $js = <<<JS
    $('.send-paperwork').click(function () {
        if (!confirm('Are you sure you want to send paperwork for this entry?')) {
            return;
        }

        $.post('/', {
            action: 'entries/saveEntry',
            sectionId: '3',
            entryId: {$inspection->id},
            enabled: '1',
            'fields[inspectionStatus]': 'Unopened'
        }, function () {
            Craft.cp.displayNotice('Paperwork for this inspection has been successfully sent');
            $('.send-paperwork').hide();
            $('select[name="fields[inspectionStatus]"]').val('Unopened');
        })
    });
JS;

\Craft\craft()->templates->includeJs($js);
?>