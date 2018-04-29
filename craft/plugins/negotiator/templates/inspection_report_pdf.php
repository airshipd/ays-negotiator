<?php
/** @var \Craft\BaseElementModel $inspection */

/**
 * @param $text
 * @return string
 */
function h($text) {
    return htmlentities($text, ENT_COMPAT, 'UTF-8');
}

function format_date($date)
{
    if (empty($date) || !strtotime($date)) {
        return '';
    }

    return date('d/m/Y', strtotime($date));
}

function format_mmyy($date)
{
    if (empty($date) || !strtotime($date)) {
        return '';
    }

    return date('m/y', strtotime($date));
}

function yesno($bool, $only = null)
{
    if ($only === true) {
        return $bool ? '<span class=highlight>Yes</span>' : 'Yes';
    } elseif ($only === false) {
        return $bool ? 'No' : '<span class=highlight>No</span>';
    } else {
        if($bool) {
            return '<span class=highlight>Yes</span> / No';
        } else {
            return 'Yes / <span class=highlight>No</span>';
        }
    }
}

$auto = (string)$inspection->transmission === 'auto' ? 'highlight' : '';
$manual = (string)$inspection->transmission === 'manual' ? 'highlight' : '';

$petrol = (string)$inspection->engineType === 'petrol' ? 'highlight' : '';
$diesel = (string)$inspection->engineType === 'diesel' ? 'highlight' : '';
$gas = (string)$inspection->engineType === 'gas' ? 'highlight' : '';
$electric = (string)$inspection->engineType === 'electric' ? 'highlight' : '';

$wd4 = (string)$inspection->driveTrain === '4X' ? 'highlight' : '';
$wd2 = (string)$inspection->driveTrain === '2WD' ? 'highlight' : '';

?>

<style>
    @page {
        margin-header: 5mm;
        margin-footer: 3mm;
        header: header;
        footer: footer;
    }

    body {
        font-size: 14px;
        font-family: Cambria;
    }

    .string {
        width: 100%;
    }
    .string td {
        height: 35px;
        vertical-align: bottom;
    }
    .string .underline {
        border-bottom: 1px solid black;
        padding-left: 10px;
    }
    .string .dotted {
        border-bottom: 1px dotted black;
    }
    .string .text {
        width: 1px;
        white-space: nowrap;
    }

    .highlight {
        background-color: #ffe100;
    }

    .list-1 td {
        font-weight: bold;
        text-transform: uppercase;
    }

    .list-2 td {
        text-align: justify;
    }

    .contract {
        margin-top: 20px;
        font-size: 11px;
    }
    .contract td {
        padding-bottom: 5px;
        vertical-align: top;
        font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    }

</style>

<htmlpageheader name="header">
    <div style="text-align: center">
        <img src="ays_header_logo.png" width="50%" />
    </div>
</htmlpageheader>

<htmlpagefooter name="footer">
    <table style="width: 100%; font-family: Calibri; font-size: 12px;">
        <tr>
            <td width="35%" align="center">Car Buyers Australia Pty Ltd.</td>
            <td width="30%" align="center">ABN: 46 159 545 758.</td>
            <td width="35%" align="center">LMCT 11137</td>
        </tr>
    </table>
</htmlpagefooter>

<!-- Page 1 -->

<table class="string">
    <tr>
        <td class="text">Seller (owner or vehicle)</td>
        <td class="underline"><?= h($inspection->customerName) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Telephone</td>
        <td class="underline"><?= h($inspection->customerMobileNumber ?: $inspection->customerPhoneNumber) ?></td>
        <td class="text">Email</td>
        <td class="underline"><?= h($inspection->customerEmail) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Address</td>
        <td class="underline"><?= h($inspection->customerAddress) ?></td>
        <td class="text">STATE:</td>
        <td class="underline" width="200"><?= h($inspection->customerState) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Driver's Licence No</td>
        <td class="underline"><?= h($inspection->customerDriversLicense) ?></td>
        <td class="text">Exp</td>
        <td class="underline"><?= format_date($inspection->customerDriversLicenseExpirationDate) ?></td>
        <td class="text">DOB</td>
        <td class="underline"><?= format_date($inspection->customerDob) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Year</td>
        <td class="underline" width="100"><?= h($inspection->year) ?></td>
        <td class="text">Make</td>
        <td class="underline"><?= h($inspection->make) ?></td>
        <td class="text">Model</td>
        <td class="underline"><?= h($inspection->model) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Badge</td>
        <td class="underline"><?= h($inspection->badge) ?></td>
        <td class="text">Series</td>
        <td class="underline"><?= h($inspection->series) ?></td>
        <td class="text">Body</td>
        <td class="underline"><?= h($inspection->carBody) ?></td>
        <td class="text">Colour</td>
        <td class="underline"><?= h($inspection->colour) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Engine Size</td>
        <td class="underline"><?= h($inspection->engineSize) ?></td>
        <td width="200" align="center"><span class="<?= $auto ?> highlight">Auto</span> / <span class="<?= $manual ?>">Manual</span></td>
        <td class="text">Odometer</td>
        <td class="underline"><?= h($inspection->odometer) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Seats:</td>
        <td>
            <?php for($i = 2; $i < 9; ++$i) {
                if($inspection->seats == $i) {
                    echo '<span class=highlight>' . $i . '</span> ';
                } else {
                    echo $i, ' ';
                }
                if((int)$inspection->seats > 8) {
                    echo '<span class=highlight>' . $inspection->seats . '</span>';
                }
            } ?>
        </td>
        <td class="text">Doors:</td>
        <td>
            <?php for($i = 2; $i < 7; ++$i) {
                if($inspection->doors == $i) {
                    echo '<span class=highlight>' . $i . '</span> ';
                } else {
                    echo $i, ' ';
                }
            } ?>
        </td>
        <td align="center" width="250">
            <span class="<?= $petrol ?>">Petrol</span> /
            <span class="<?= $diesel ?>">Diesel</span> /
            <span class="<?= $gas ?>">Gas</span> /
            <span class="<?= $electric ?>">Electric</span>
        </td>
        <td class="text"><span class="<?= $wd4 ?>">4x4</span> / <span class="<?= $wd2 ?>">2WD</span></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Chassis / Vin No</td>
        <td class="underline"><?= h($inspection->chassisVinNumber) ?></td>
        <td class="text">Engine Number</td>
        <td class="underline"><?= h($inspection->engineNumber) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Reg No</td>
        <td class="underline"><?= h($inspection->registrationNumber) ?></td>
        <td class="text">Exp Date</td>
        <td class="underline"><?= format_date($inspection->registrationExpirationDate) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Build Date</td>
        <td class="underline"><?= format_mmyy($inspection->buildDate) ?></td>
        <td class="text">Compliance Date</td>
        <td class="underline"><?= format_mmyy($inspection->complianceDate) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Finance:</td>
        <td class="" width="150"><?= yesno($inspection->finance) ?></td>
        <td class="text">If yes, which company</td>
        <td class="underline"><?= h($inspection->financeCompany) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Write off:</td>
        <td class=""><?= yesno($inspection->writeOff) ?></td>
        <td class="text">Registration Papers Supplied:</td>
        <td class=""><?= yesno($inspection->registrationPapers) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">Insurance (details)</td>
        <td class="underline"></td>
    </tr>
</table>
<table class="string" style="margin-top: 10px;">
    <tr>
        <td class="text">Seller's Signature</td>
        <td class="dotted" width="200"></td>
        <td class=""></td>
        <td class="text">Date</td>
        <td class="dotted" width="150"><?= format_date($inspection->contractDate) ?: date('d / m / Y') ?></td>
    </tr>
</table>

<?php if($inspection->customerSignatureString) { ?>
    <!-- I know it's sooo dirty, but this is the only way to position an element absolutely in mPDF. -->
    <div style="position: absolute; left: 200px; top: 750px;">
        <img src="<?= h($inspection->customerSignatureString) ?>" style="max-width: 150px;" />
    </div>
<?php } ?>

<div style="margin-top: 30px;">
    <b>BANK DETAILS</b> – Must be the registered owner of the vehicle unless a Letter of Authority is signed with additional information supplied
</div>

<table class="string" style="margin-top: 10px;">
    <tr>
        <td class="text">BSB</td>
        <td class="underline"><?= h($inspection->bsb) ?></td>
        <td class="text">ACCOUNT</td>
        <td class="underline"><?= h($inspection->bankAccountNumber) ?></td>
    </tr>
</table>
<table class="string">
    <tr>
        <td class="text">NAME</td>
        <td class="underline"><?= h($inspection->customerName) ?></td>
        <td class="text">BANK</td>
        <td class="underline"><?= h($inspection->bank) ?></td>
    </tr>
</table>

<pagebreak />

<div align="right" style="font-size: 12px;">
    <?php if($inspection->contractDate) { ?>
        Date: <?= date('d / m / Y', strtotime($inspection->contractDate)) ?>
    <?php } else { ?>
        Date: <?= date('d / m / Y') ?>
    <?php } ?>
</div>

<div style="width: 80%;">
    <table class="string" style="font-size: 12px;">
        <tr>
            <td class="text">MAKE:</td>
            <td class="dotted" width="260"><?= h($inspection->make) ?></td>
            <td class="text" style="padding-left: 20px;">YEAR:</td>
            <td class="dotted"><?= h($inspection->year) ?></td>
        </tr>
    </table>
    <table class="string" style="font-size: 12px;">
        <tr>
            <td class="text">MODEL:</td>
            <td class="dotted" width="250"><?= h($inspection->model) ?></td>
            <td class="text" style="padding-left: 20px;">KILOMETRES:</td>
            <td class="dotted"><?= h($inspection->kilometres ?: $inspection->odometer) ?></td>
        </tr>
    </table>
    <table class="string" style="font-size: 12px;">
        <tr>
            <td class="text">I,</td>
            <td class="dotted"><?= h($inspection->customerName) ?></td>
        </tr>
        <tr>
            <td class="text">of,</td>
            <td class="dotted"><?= h($inspection->customerAddress) ?></td>
        </tr>
    </table>
</div>

<div style="margin-top: 15px;">
    hereby agree to sell my car to Car Buyers Australia Pty Ltd (<b>Car Buyers</b>) for the amount of:
</div>
<div style="margin-top: 15px;">
    $ <span style="display: inline-block; border-bottom: 1px dotted #000; padding-right: 200px;"><?= $inspection->agreedPrice ?: $inspection->reviewValuation - $inspection->approximateExpenditure ?></span>
    <b>(Purchase Price)</b>
</div>

<pagebreak />

<style>
    .options {
        width: 100%;
        font-size: 12px;
    }
    .options td {
        height: 30px;
        vertical-align: bottom;
    }
    .options td:nth-child(2),
    .options td:nth-child(3) {
        text-align: right;
    }

    .last-tables {
        font-size: 12px;
        font-weight: bold;
        width: 100%;
    }
</style>

<div style="width: 90%;">

    <table style="font-weight: bold; width: 100%;">
        <tr>
            <td>Specific Vehicle Information</td>
            <td align="right">REGO</td>
            <td width="200" style="border-bottom: 1px solid #000;"><?= h($inspection->registrationNumber) ?></td>
        </tr>
    </table>

    <div style="font-weight: bold; margin-top: 20px; text-align: center;">
        PLEASE CIRCLE
    </div>

    <table class="options">
        <tr>
            <td>Service History</td>
            <td><?php if($inspection->serviceHistory == 'yes') { ?>
                    <span class="highlight">Yes (<?= $inspection->serviceHistoryFactory ? 'factory' : 'non factory' ?>)</span>
                <?php } else { ?>
                    Yes
                <?php } ?>
            </td>
            <td width="200">
                <?php if($inspection->serviceHistory == 'partial') { ?>
                    <span class="highlight">Partial (<?= $inspection->serviceHistoryFactory ? 'factory' : 'non factory' ?>, <?= $inspection->serviceHistoryPartial ?>%)</span>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <?php } else { ?>
                    Partial&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <?php } ?>

                <span class="<?= $inspection->serviceHistory == 'no' ? 'highlight' : '' ?>">No</span>
            </td>
        </tr>
        <tr>
            <td>Owner's Manual</td>
            <td><?= yesno($inspection->ownersManual, true) ?></td>
            <td><?= yesno($inspection->ownersManual, false) ?></td>
        </tr>
        <tr>
            <td>Spare Key</td>
            <td><?= yesno($inspection->spareKey, true) ?></td>
            <td><?= yesno($inspection->spareKey, false) ?></td>
        </tr>
        <tr>
            <td>Sunroof</td>
            <td><?= yesno($inspection->sunroof, true) ?></td>
            <td><?= yesno($inspection->sunroof, false) ?></td>
        </tr>
        <tr>
            <td>Leather</td>
            <td><?= yesno($inspection->leatherUpholstery, true) ?></td>
            <td><?= yesno($inspection->leatherUpholstery, false) ?></td>
        </tr>
        <tr>
            <td>Sat Nav</td>
            <td><?= yesno($inspection->satNav, true) ?></td>
            <td><?= yesno($inspection->satNav, false) ?></td>
        </tr>
        <tr>
            <td>Wheels</td>
            <td><span class="<?= $inspection->wheels == 'alloys' ? 'highlight' : '' ?>">Alloys</span></td>
            <td><span class="<?= $inspection->wheels == 'hubCaps' ? 'highlight' : '' ?>">Hub Caps</span></td>
        </tr>
        <tr>
            <td>Takata Airbag Recall</td>
            <td>
                <?php if($inspection->takataAirbagRecall == 'yes') { ?>
                    <span class="highlight">Yes</span>

                    <?php if ($inspection->takataAirbagRecallStatus) {
                        echo '(' . $inspection->takataAirbagRecallStatus . ')';
                    } ?>
                <?php } else { ?>
                    Yes
                <?php } ?>
            </td>
            <td width="200">
                <span class="<?= $inspection->takataAirbagRecall == 'no' ? 'highlight' : '' ?>">No</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span class="<?= $inspection->takataAirbagRecall == 'unsure' ? 'highlight' : '' ?>">Unsure</span>
            </td>
        </tr>
        <tr>
            <td>Personalised Number Plates</td>
            <td><?= yesno($inspection->personalisedNumberPlates, true) ?></td>
            <td><?= yesno($inspection->personalisedNumberPlates, false) ?></td>
        </tr>
        <?php if($inspection->personalisedNumberPlates) { ?>
        <tr>
            <td>Wants to Keep Number Plates</td>
            <td><?= yesno($inspection->keepNumberPlates, true) ?></td>
            <td><?= yesno($inspection->keepNumberPlates, false) ?></td>
        </tr>
        <?php } ?>
        <tr>
            <td>Tradesman Extra's</td>
            <td><?= yesno($inspection->tradesmanExtras, true) ?></td>
            <td><?= yesno($inspection->tradesmanExtras, false) ?></td>
        </tr>
    </table>

    <table class="last-tables" style="margin-top: 10px;">
        <tr>
            <td>Please specify</td>
            <td style="border-bottom: 1px solid #000" width="500"><?= h($inspection->tradesmanExtrasDescription) ?></td>
        </tr>
    </table>

    <table class="last-tables" style="margin-top: 20px;">
        <tr>
            <td width="300" align="left">Upgrades or modifications</td>
            <td width="100" align="right"><?= yesno($inspection->upgradesMods, true) ?></td>
            <td align="right"><?= yesno($inspection->upgradesMods, false) ?></td>
        </tr>
    </table>

    <table class="last-tables" style="margin-top: 10px;">
        <tr>
            <td>Please Specify</td>
            <td width="500" style="border-bottom: 1px solid #000"><?= h($inspection->upgradesAndModsDescription) ?></td>
        </tr>
    </table>

    <table class="last-tables" style="margin-top: 20px;">
        <tr>
            <td width="300" align="left">Sports Kit (E.g.: M Sport, S Line, AMG)</td>
            <td width="100" align="right"><?= yesno($inspection->sportsKit, true) ?></td>
            <td align="right"><?= yesno($inspection->sportsKit, false) ?></td>
        </tr>
    </table>

    <table class="last-tables" style="margin-top: 10px;">
        <tr>
            <td>Please Specify</td>
            <td width="500" style="border-bottom: 1px solid #000"><?= h($inspection->sportsKitDescription) ?></td>
        </tr>
    </table>

    <div class="last-tables" style="margin-top: 20px;">
        Damage &amp; Faults – E.G: Body work, tyres, all mechanical, windscreen, dings, scratches etc.
    </div>

    <?php if(strip_tags($inspection->damageAndFaults)) { ?>
        <pre style="text-decoration: underline; margin-top: 10px; font-weight: normal; font-family: Cambria;"><?= strip_tags(str_replace('<br />', "\n", $inspection->damageAndFaults)) ?></pre>
    <?php } else { ?>
        <div style="border-bottom: 1px solid #000; line-height: 30px;">&nbsp;</div>
        <div style="border-bottom: 1px solid #000; line-height: 30px;">&nbsp;</div>
        <div style="border-bottom: 1px solid #000; line-height: 30px;">&nbsp;</div>
    <?php } ?>

    <table class="last-tables" style="margin-top: 30px;">
        <tr>
            <td width="1" style="white-space: nowrap;">Total Approximate Spend required:</td>
            <td style="border-bottom: 1px solid #000">$ <?= number_format($inspection->approximateExpenditure) ?></td>
        </tr>
    </table>
</div>
