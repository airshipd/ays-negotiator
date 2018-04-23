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
        <td colspan="2" style="border-bottom: 1px dotted #000; vertical-align: bottom;"><?= h($inspection->repName) ?></td>
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

<?php if($inspection->repSignatureString) { ?>
    <!-- I know it's sooo dirty, but this is the only way to position an element absolutely in mPDF. -->
    <div style="position: absolute; left: 380px; top: 510px;">
        <img src="<?= h($inspection->repSignatureString) ?>" style="max-width: 150px;" />
    </div>
<?php } ?>

<div style="font-size: 11px; border-bottom: 1px dotted #000; margin-top: 10px; line-height: 25px;">
    <b>PAYMENT OR COLLECTION SPECIAL REQUIREMENTS</b> (<b>Pick up address</b> and <b>Contact</b> if different to above)<br/>
    <?= h($inspection->pickupAddressAndContact) ?><br/>
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
    </table>

    <table class="last-tables" style="margin-top: 40px;">
        <tr>
            <td>Please specify</td>
            <td style="border-bottom: 1px solid #000"></td>
        </tr>
        <tr>
            <td>Or Circle:</td>
            <td>
                Bull bar&nbsp;&nbsp;&nbsp;
                tow bar&nbsp;&nbsp;&nbsp;
                Winch&nbsp;&nbsp;&nbsp;
                Canopy&nbsp;&nbsp;&nbsp;
                Spotlight&nbsp;&nbsp;&nbsp;
                Snorkel&nbsp;&nbsp;&nbsp;
                hard lid&nbsp;&nbsp;&nbsp;
                soft top
            </td>
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
