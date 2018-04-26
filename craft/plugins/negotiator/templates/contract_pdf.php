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

<div style="margin-top: 40px; font-weight: bold; font-size: 12px;">
    I agree to the following terms:
</div>

<table class="contract">
    <tr class="list-1">
        <td width="50">1)</td>
        <td>Definitions</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>"Car Buyers" means Car Buyers Australia Pty Ltd ABN 46 159 545 758, LMCT 11137, its agents, contractors, servants and employees and any
            related bodies corporate as defined in the Corporations Act 2001 (Cth);</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>"Claim" means any claim, demand, action or proceeding;</td>
    </tr>
    <tr class="list-2">
        <td>c)</td>
        <td>"Consequential Loss" means any loss or damage suffered by a party or any other person which is indirect or consequential,
            including but not limited to loss of revenue, loss of income, loss of business, loss of profits, loss of goodwill or credit,
            loss of business reputation, loss of data or data use, future reputation or publicity, loss of use, loss of interest,
            damage to credit rating or loss or denial of opportunity;</td>
    </tr>
    <tr class="list-2">
        <td>d)</td>
        <td>"Appraisal Fee" means the fee of $500 (plus GST) for the appraisal of the Vehicle, including the costs of on-site inspection, valuation and administration.
            The Appraisal Fee is only payable where the Seller exercises its right to cancel this Agreement under clause 9.</td>
    </tr>
    <tr class="list-2">
        <td>e)</td>
        <td>"Payment Amount" means the Purchase Price less the Service Fee;</td>
    </tr>
    <tr class="list-2">
        <td>f)</td>
        <td>"Payout Figure" means the amount owed to the financier of the Vehicle to discharge any loan against the Vehicle, including any and all associated fees;</td>
    </tr>
    <tr class="list-2">
        <td>g)</td>
        <td>"Seller" means the owner of the Vehicle identified in this agreement;</td>
    </tr>
    <tr class="list-2">
        <td>h)</td>
        <td>"Service Fee" means the fee for the performance of the Services in the amount of $182 (plus GST) or such other amount notified
            by Car Buyers to the Seller in writing prior to entering into this agreement;</td>
    </tr>
    <tr class="list-2">
        <td>i)</td>
        <td>"Services" means services performed by Car Buyers including background, history, ownership and security checks, transfer and collection of the Vehicle;</td>
    </tr>
    <tr class="list-2">
        <td>j)</td>
        <td>"Vehicle" means the vehicle identified in this agreement.</td>
    </tr>

    <tr class="list-1">
        <td>2)</td>
        <td>Service Fee</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>For any sale over $2,000, a Service Fee is payable by the Seller to Car Buyers.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>The Service Fee:</td>
    </tr>
    <tr class="list-3">
        <td></td>
        <td>
            <table>
                <tr>
                    <td width="50">i)</td>
                    <td>covers the cost of the Services;</td>
                </tr>
                <tr>
                    <td>ii)</td>
                    <td>is non-negotiable; and</td>
                </tr>
                <tr>
                    <td>iii)</td>
                    <td>will be deducted from the Purchase Price.</td>
                </tr>
            </table>
        </td>
    </tr>

    <tr class="list-1">
        <td>3)</td>
        <td>Payment</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>Car Buyers will pay the Payment Amount to the account nominated by the Seller within 7 days of the date of this agreement,
            provided the Seller has provided Car Buyers will all necessary information and material and is otherwise in compliance with the terms of this agreement.</td>
    </tr>

    <tr class="list-1">
        <td>4)</td>
        <td>Vehicles subject to finance</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>If the Vehicle is subject to finance, the Seller must do anything that Car Buyers reasonably requires to obtain the Payout Figure from the financier.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>If the Payout Figure is more than the Payment Amount, Car Buyers may:</td>
    </tr>
    <tr class="list-3">
        <td></td>
        <td>
            <table>
                <tr>
                    <td width="50">i)</td>
                    <td>cancel this agreement in accordance with clause 10) and invoice the Seller for any applicable Service Fee; or</td>
                </tr>
                <tr>
                    <td>ii)</td>
                    <td>agree to receive payment of the difference from the Seller (plus any Service Fee) so that Car Buyers can pay the Payout Figure
                        to the financier to discharge any loan against the Vehicle, with such payment to be deemed payment by Car Buyers of the Purchase
                        Price under this agreement.</td>
                </tr>
            </table>
        </td>
    </tr>

    <tr class="list-1">
        <td>5)</td>
        <td>Warranties</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>The Seller warrants that:</td>
    </tr>
    <tr class="list-3">
        <td></td>
        <td>
            <table>
                <tr>
                    <td width="50">i)</td>
                    <td>it has the sole right, power and authority to enter into this agreement and fulfil its obligations under this agreement;</td>
                </tr>
                <tr>
                    <td>ii)</td>
                    <td>in selling the Vehicle, it will not be in breach of any obligation owed to any person;</td>
                </tr>
                <tr>
                    <td>iii)</td>
                    <td>all information provided by the Seller in this agreement is true, complete and not misleading;</td>
                </tr>
                <tr>
                    <td>iv)</td>
                    <td>it will not permit the Vehicle to be driven without the written consent of Car Buyers after the date of this agreement;</td>
                </tr>
                <tr>
                    <td>v)</td>
                    <td>on collection of the Vehicle by Car Buyers, the Vehicle will be in the same condition as when the Vehicle was inspected by Car Buyers,
                        prior to entering into this agreement;</td>
                </tr>
                <tr>
                    <td>vi)</td>
                    <td>at the time of payment of the Payment Amount, title to the Vehicle will pass to Car Buyers free of any encumbrance and third party interests; and</td>
                </tr>
                <tr>
                    <td>vii)</td>
                    <td>it will remove any advertisements for the sale of the Vehicle immediately upon notification of payment by Car Buyers.</td>
                </tr>
            </table>
        </td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>These warranties apply as at the date of this agreement and at the date of collection of the Vehicle by Car Buyers.</td>
    </tr>

    <tr class="list-1">
        <td>6)</td>
        <td>Collection</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>The Seller must take all reasonable steps to make the Vehicle, together with all manuals, keys, service history and registration details (if applicable),
            available for immediate collection once Car Buyers has provided proof of payment of the Payment Amount, or at any other time mutually agreed between the parties.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Car Buyers will use reasonable endeavours to arrange collection of the Vehicle at the time agreed between the parties, or otherwise as soon as reasonably practicable.</td>
    </tr>

    <tr class="list-1">
        <td>7)</td>
        <td>Insurance</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>The Seller must maintain any insurance policies in place as at the date of this agreement until collection of the vehicle by Car Buyers.</td>
    </tr>

    <tr class="list-1">
        <td>8)</td>
        <td>Risk and title</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>All risk in and to the Vehicle will pass to Car Buyers upon collection of the Vehicle by Car Buyers.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Legal and equitable title in and to the Vehicle will pass to Car Buyers upon payment of the Payment Amount.</td>
    </tr>
    <tr class="list-2">
        <td>c)</td>
        <td>The Seller acknowledges that until title in and to the Vehicle passes to Car Buyers in accordance with this agreement,
            the Seller holds the Vehicle as bailee of Car Buyers and that a fiduciary relationship exists between the Seller and Car Buyers.</td>
    </tr>

    <tr class="list-1">
        <td>9)</td>
        <td>CANCELLATION BY THE SELLER</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>The Seller may terminate this agreement at any time before Car Buyers has made payment of the Payment Amount by providing
            at least 24 business hours written notice to Car Buyers.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Notice of cancellation must be sent to admin@carhouseaustralia.com.au or such other address nominated by Car Buyers in writing from time to time.</td>
    </tr>
    <tr class="list-2">
        <td>c)</td>
        <td>In the event of cancellation by the Seller, the Appraisal Fee will be payable immediately by the Seller to Car Buyers in addition to payment of the Service Fee.</td>
    </tr>

    <tr class="list-1">
        <td>10)</td>
        <td>CANCELLATION BY CAR BUYERS</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>Car Buyers may terminate this agreement by providing written notice to the Seller at any time before making payment of the
            Payment Amount at its sole and absolute discretion.</td>
    </tr>

    <tr class="list-1">
        <td>11)</td>
        <td>LIMITATION OF LIABILITY</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>To the full extent permitted by law, Car Buyers' liability under this agreement is limited to payment of the Purchase Price.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Under no circumstances will Car Buyers be liable for any Consequential Loss and any such Consequential Loss is expressly excluded.</td>
    </tr>

    <tr class="list-1">
        <td>12)</td>
        <td>INDEMNITY AND RELEASE</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>Except where legislation cannot be excluded or would make this clause illegal, or where the inclusion of this clause would make Car Buyers liable
            to a penalty, the Seller releases and indemnifies Car Buyers from any Claim that is made against Car Buyers in respect of any loss, damage,
            death or injury arising from negligence or otherwise caused directly or indirectly or arising out of the use or condition of the Vehicle sold to Car Buyers,
            including Consequential Loss, except to the extent that such loss, damage, death or injury has been caused by Car Buyers.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Without limiting the foregoing, the Seller indemnifies and agrees to keep indemnified, Car Buyers from and against any loss, cost damage or expense
            (including legal costs on a full indemnity basis) incurred by Car Buyers in connection with any breach of warranty provided by the Seller under this agreement.</td>
    </tr>

    <tr class="list-1">
        <td>13)</td>
        <td>INTELLECTUAL PROPERTY</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>The Seller acknowledges that Car Buyers is the proprietor or licensee of all intellectual property rights in materials and information provided by
            Car Buyers to the Seller under or in connection with this agreement and that such materials and information are supplied to the Seller solely for
            the purposes of the Seller meeting its obligations under this agreement.</td>
    </tr>

    <tr class="list-1">
        <td>14)</td>
        <td>PERSONAL PROPERTY AND SECURITY ACT ("PPSA")</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>The Seller acknowledges that this agreement constitutes a security agreement for the purposes of the Personal Property Securities Act 2009 (Cth) (PPSA)
            and Car Buyers has a security interest in the Vehicle supplied under this agreement.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>The Seller acknowledges that from the date of this agreement Car Buyers may register a security interest in the Vehicle on the Personal Property Securities Register.</td>
    </tr>
    <tr class="list-2">
        <td>с)</td>
        <td>The Seller agrees to do anything that Car Buyers reasonably requires to ensure that Car Buyers has at all times a continuously and perfected security interest over the Vehicle.</td>
    </tr>

    <tr class="list-1">
        <td>15)</td>
        <td>GST</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>If GST is payable by a supplier (or by the representative member for a GST group of which the supplier is a member) on any supply made under or
            in relation to this agreement, the recipient must pay to the supplier an amount (GST Amount) equal to the GST payable on the supply.
            The GST Amount is payable by the recipient in addition to and at the same time as the net consideration for the supply.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>If a party is required to make any payment or reimbursement, that payment or reimbursement must be reduced by the amount of any input tax credits
            or reduced input tax credits to which the other party (or the representative member for a GST group of which it is a member) is entitled for any
            acquisition relating to that payment or reimbursement.</td>
    </tr>
    <tr class="list-2">
        <td>с)</td>
        <td>This clause is subject to any other specific agreement regarding the payment of GST on supplies.</td>
    </tr>

    <tr class="list-1">
        <td>16)</td>
        <td>ASSIGNMENT</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>The Seller must not transfer any right or liability under this agreement without the prior written consent of Car Buyers.</td>
    </tr>

    <tr class="list-1">
        <td>17)</td>
        <td>NOTICES</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>Any notice to or by a party under this agreement must be in writing and signed by the sender or, if a corporate party, an authorised officer of the sender.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Any notice may be served by delivery in person or by post or transmission by email to the address or number of the recipient specified in this
            agreement or most recently notified by the recipient to the sender.</td>
    </tr>
    <tr class="list-2">
        <td>с)</td>
        <td>Any notice is effective for the purposes of this agreement upon delivery to the recipient or production to the sender of a facsimile transmittal
            confirmation report before 4.00 pm local time on a day in the place in or to which the written notice is delivered or sent or otherwise at 9.00 am
            on the next day following delivery or receipt.</td>
    </tr>

    <tr class="list-1">
        <td>18)</td>
        <td>GOVERNING LAW AND JURISDICTION</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>This agreement is governed by and construed under the law in the State of Victoria.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Any legal action in relation to this agreement against any party or its property may be brought in any court of competent jurisdiction in the State of Victoria.</td>
    </tr>
    <tr class="list-2">
        <td>с)</td>
        <td>Each party by execution of this agreement irrevocably, generally and unconditionally submits to the non-exclusive jurisdiction
            of any court specified in this clause in relation to both itself and its property.</td>
    </tr>

    <tr class="list-1">
        <td>19)</td>
        <td>AMENDMENTS</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>Any amendment to this agreement has no force or effect, unless effected by a document executed by the parties.</td>
    </tr>

    <tr class="list-1">
        <td>20)</td>
        <td>THIRD PARTIES</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>This agreement confers rights only upon a person expressed to be a party, and not upon any other person.</td>
    </tr>

    <tr class="list-1">
        <td>21)</td>
        <td>PRECONTRACTUAL NEGOTIATION</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>This agreement:</td>
    </tr>
    <tr class="list-3">
        <td></td>
        <td>
            <table>
                <tr>
                    <td width="50">i)</td>
                    <td>expresses and incorporates the entire agreement between the parties in relation to its subject matter, and all the terms of that agreement; and</td>
                </tr>
                <tr>
                    <td>ii)</td>
                    <td>supersedes and excludes any prior or collateral negotiation, understanding, communication or agreement by or between
                        the parties in relation to that subject matter or any term of that agreement.</td>
                </tr>
            </table>
        </td>
    </tr>

    <tr class="list-1">
        <td>22)</td>
        <td>FURTHER ASSURANCE</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>The Seller must execute any document and perform any action necessary to give full effect to this agreement, whether before or after performance of this agreement.</td>
    </tr>

    <tr class="list-1">
        <td>23)</td>
        <td>CONTINUING PERFORMANCE</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>The provisions of this agreement do not merge with any action performed or document executed by any party for the purposes of performance of this agreement.</td>
    </tr>
    <tr class="list-2">
        <td>b)</td>
        <td>Any representation in this agreement survives the execution of any document for the purposes of, and continues after, performance of this agreement.</td>
    </tr>
    <tr class="list-2">
        <td>c)</td>
        <td>Any indemnity agreed by any party under this agreement:</td>
    </tr>
    <tr class="list-3">
        <td></td>
        <td>
            <table>
                <tr>
                    <td width="50">i)</td>
                    <td>constitutes a liability of that party separate and independent from any other liability of that party under this agreement or any other agreement; and</td>
                </tr>
                <tr>
                    <td>ii)</td>
                    <td>survives and continues after performance of this agreement.</td>
                </tr>
            </table>
        </td>
    </tr>

    <tr class="list-1">
        <td>24)</td>
        <td>WAIVERS</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>Any failure by any party to exercise any right under this agreement does not operate as a waiver and the single or partial exercise of any
            right by that party does not preclude any other or further exercise of that or any other right by that party.</td>
    </tr>

    <tr class="list-1">
        <td>25)</td>
        <td>REMEDIES</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>The rights of a party under this agreement are cumulative and not exclusive of any rights provided by law.</td>
    </tr>

    <tr class="list-1">
        <td>25)</td>
        <td>SEVERABILITY</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>Any provision of this agreement which is invalid in any jurisdiction is invalid in that jurisdiction to that extent, without invalidating or
            affecting the remaining provisions of this agreement or the validity of that provision in any other jurisdiction.</td>
    </tr>

    <tr class="list-1">
        <td>27)</td>
        <td>PARTY ACTING AS TRUSTEE</td>
    </tr>
    <tr class="list-2">
        <td>a)</td>
        <td>If a party enters into this agreement as trustee of a trust, that party and its successors as trustee of the trust will be liable under this
            agreement in its own right and as trustee of the trust. Nothing releases the party from any liability in its personal capacity.
            The party warrants that at the date of this agreement:</td>
    </tr>
    <tr class="list-3">
        <td></td>
        <td>
            <table>
                <tr>
                    <td width="50">i)</td>
                    <td>all the powers and discretions conferred by the deed establishing the trust are capable of being validly exercised by the party as
                        trustee and have not been varied or revoked and the trust is a valid and subsisting trust;</td>
                </tr>
                <tr>
                    <td>ii)</td>
                    <td>the party is the sole trustee of the trust and has full and unfettered power under the terms of the deed establishing the trust to enter
                        into and be bound by this agreement on behalf of the trust and that this agreement is being executed and entered
                        into as part of the due and proper administration of the trust and for the benefit of the beneficiaries of the trust; and</td>
                </tr>
                <tr>
                    <td>iii)</td>
                    <td>no restriction on the party’s right of indemnity out of or lien over the trust's assets exists or will be created or permitted to exist
                        and that right will have priority over the right of the beneficiaries to the trust's assets.</td>
                </tr>
            </table>
        </td>
    </tr>

    <tr class="list-1">
        <td>28)</td>
        <td>COUNTERPARTS</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>This document may be executed in any number of counterparts, all of which taken together are deemed to constitute one and the same document.</td>
    </tr>

    <tr class="list-1">
        <td>29)</td>
        <td>PRIVACY</td>
    </tr>
    <tr class="list-2">
        <td></td>
        <td>By providing your email address, you consent to us sending you our newsletters as well as promotional material, updates and further information
            about our products and services. Our Privacy Policy contains information about how you can access and correct your personal information,
            how to make a complaint, and how we deal with complaints. Our Privacy Policy can be accessed at
            <a target="_blank" href="https://www.areyouselling.com.au/privacy-policy/">www.areyouselling.com.au/privacy-policy</a>.</td>
    </tr>
</table>

<table style="margin-top: 20px; font-size: 11px; width: 90%;">
    <tr>
        <td width="200" style="border-bottom: 1px dotted #000;"></td>
        <td width="100"></td>
        <td width="200" style="border-bottom: 1px dotted #000;"></td>
        <td align="right"><?= date('d / m / Y') ?></td>
    </tr>
    <tr>
        <td>Seller's Signature</td>
        <td></td>
        <td colspan="2">Car Buyers Representative (Witness) Signature &amp; Date</td>
    </tr>
    <tr>
        <td style="border-bottom: 1px dotted #000; height: 40px; vertical-align: bottom;"><?= h($inspection->customerName) ?></td>
        <td></td>
        <td colspan="2" style="border-bottom: 1px dotted #000; vertical-align: bottom;"><?= !$inspection->repName && !$inspection->repSignatureString ? 'Nissar Munseea' : h($inspection->repName) ?></td>
    </tr>
    <tr>
        <td>Seller Name (please print)</td>
        <td></td>
        <td colspan="2">Car Buyers Representative (Witness) Name</td>
    </tr>
</table>

<?php if($inspection->customerSignatureString) { ?>
    <!-- I know it's sooo dirty, but this is the only way to position an element absolutely in mPDF. -->
    <div style="position: absolute; left: 80px; top: 510px;">
        <img src="<?= h($inspection->customerSignatureString) ?>" style="max-width: 150px;" />
    </div>
<?php } ?>

<!-- I know it's sooo dirty, but this is the only way to position an element absolutely in mPDF. -->
<div style="position: absolute; left: 380px; top: 510px;">
    <?php if ($inspection->repSignatureString) { ?>
        <img src="<?= h($inspection->repSignatureString) ?>" style="max-width: 150px;" />
    <?php } elseif(!$inspection->repName) { ?>
        <img src="data:image/png;base64,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" style="max-width: 150px;" />
    <?php } ?>
</div>

<div style="font-size: 11px; border-bottom: 1px dotted #000; margin-top: 10px; line-height: 25px;">
    <b>PAYMENT OR COLLECTION SPECIAL REQUIREMENTS</b> (<b>Pick up address</b> and <b>Contact</b> if different to above)<br/>
    <?= h($inspection->pickupAddressAndContact) ?><br/>
</div>

<?php if(!\Craft\craft()->request->getParam('full') || !\Craft\craft()->userSession->isAdmin()) {
    return;
} ?>

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
            <td>Service Books</td>
            <td><span>Yes</span></td>
            <td width="200">
                Partial&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;No
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
            <td>Tradesman Extra's</td>
            <td><?= yesno($inspection->tradesmanExtras, true) ?></td>
            <td><?= yesno($inspection->tradesmanExtras, false) ?></td>
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
    </table>

    <table class="last-tables" style="margin-top: 40px;">
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
