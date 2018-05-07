<?php
/**
 * @var \Craft\EntryModel $inspection
 */
$id = $inspection->id;
?>

<?php if($inspection->inspectionStatus != 'Unopened') { ?>
    <a href="#" class="btn send-paperwork">Send for Paperwork</a><br/><br/>
<?php } ?>

<a href="/contract/<?= $id ?>/download" class="btn" target="_blank">Customer Contract PDF</a><br/><br/>
<a href="/inspection-report/<?= $id ?>/download" class="btn" target="_blank">Inspection Report</a><br/><br/>
<a href="/internalrecord/<?= $id ?>" class="btn" target="_blank">Internal Record</a><br/><br/>


<?php $js = <<<JS
    $('.send-paperwork').click(function () {
        if (!confirm('Are you sure you want to send paperwork for this entry?')) {
            return;
        }

        $.post('/api/sendPaperwork/$id', function () {
            Craft.cp.displayNotice('Paperwork for this inspection has been successfully sent');
            $('.send-paperwork').hide();
            $('select[name="fields[inspectionStatus]"]').val('Unopened');
        })
    });
JS;

\Craft\craft()->templates->includeJs($js);
?>