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

function yesno($bool)
{
    if($bool) {
        return '<span class=highlight>Yes</span> / No';
    } else {
        return 'Yes / <span class=highlight>No</span>';
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

<sethtmlpageheader name="header" value="on" show-this-page="1" />
<sethtmlpagefooter name="footer" value="on" show-this-page="1" />

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
        <td class="text">Service Books:</td>
        <td class=""><?= yesno($inspection->serviceBooks) ?></td>
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
        <td class="dotted" width="150"><?= format_date($inspection->contractDate) ?></td>
    </tr>
</table>

<div align="center" style="font-weight: bold; margin-top: 20px;">Has the seller received a copy of this agreement: YES / NO</div>
<div style="margin-top: 10px;">
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
<sethtmlpageheader name="header" value="on" show-this-page="1" />
<sethtmlpagefooter name="footer" value="on" show-this-page="1" />

<div align="right">
    <?php if($inspection->contractDate) { ?>
        Date: <?= date('d / m / Y', strtotime($inspection->contractDate)) ?>
    <?php } else { ?>
        Date: .... / .... / <?= date('Y') ?>
    <?php } ?>
</div>

<div style="width: 80%;">
    <table class="string">
        <tr>
            <td class="text">MAKE:</td>
            <td class="dotted" width="260"><?= h($inspection->make) ?></td>
            <td class="text" style="padding-left: 20px;">YEAR:</td>
            <td class="dotted"><?= h($inspection->year) ?></td>
        </tr>
    </table>
    <table class="string">
        <tr>
            <td class="text">MODEL:</td>
            <td class="dotted" width="250"><?= h($inspection->model) ?></td>
            <td class="text" style="padding-left: 20px;">KILOMETRES:</td>
            <td class="dotted"><?= h($inspection->kilometres ?: $inspection->odometer) ?></td>
        </tr>
    </table>
    <table class="string">
        <tr>
            <td class="text">I,</td>
            <td class="dotted"><?= h($inspection->customerName) ?></td>
        </tr>
        <tr>
            <td class="text">of,</td>
            <td class="dotted"></td>
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

<div style="margin-top: 40px; font-weight: bold;">
    I agree to the following terms:
</div>