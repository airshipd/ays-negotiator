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
<a href="/contract-full/<?= $id ?>/download" class="btn" target="_blank">Contract of Sale + Inspection Report + License and Registration Photos</a><br/><br/>
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

    $(function() {
        //make it possible to download original photos easily
        $('.element.hasthumb').each(function() {
            if ($(this).parents('#author-field').length) {
                return;
            }
            
            var title = $(this).find('.label .title');
            var a = $('<a/>').text(title.text()).attr('class', 'title').attr('target', '_blank').attr('href', $(this).data('url'));
            title.replaceWith(a);
        });
    });
JS;

\Craft\craft()->templates->includeJs($js);
?>