<?php

namespace Craft;

/**
 * Class Negotiator_RunbikestopModel
 *
 * @package Craft
 *
 * @property int id
 * @property string name
 * @property string email
 * @property string phone
 * @property string address
 * @property string colour
 * @property string description
 * @property string make
 * @property string model
 * @property string build_year
 * @property string engine
 * @property string kms
 * @property string series
 * @property string state
 * @property int    year
 * @property string city
 * @property string transmission
 * @property string body
 * @property string badge
 * @property string car_colour
 * @property int    doors
 * @property string fuel_type
 * @property string fwd_rwd
 * @property string spare_key yes|no
 * @property string log_books yes|no
 * @property string rego
 * @property string rego_expiry
 * @property string sunroof yes|no
 * @property string sat_nav yes|no
 * @property string leather yes|no
 * @property int    seats
 * @property int    finance_value
 * @property string estimate
 * @property string inspector_email
 * @property string sales_consultant_email
 * @property float  latest_pricing
 */
class Negotiator_RunbikestopModel extends BaseModel
{
    public function __construct($attributes = null)
    {
        foreach ($attributes as &$value) {
            if(is_string($value)) {
                $value = trim($value);
            }
        }

        parent::__construct($attributes);
    }


    protected function defineAttributes()
    {
        return [
            'id' => AttributeType::Number,
            'email' => AttributeType::Mixed,
            'name' => AttributeType::Mixed,
            'phone' => AttributeType::Mixed,
            'address' => AttributeType::Mixed,
            'colour' => AttributeType::Mixed,
            'description' => AttributeType::Mixed,
            'make' => AttributeType::Mixed,
            'model' => AttributeType::Mixed,
            'build_year' => AttributeType::Mixed,
            'engine' => AttributeType::Mixed,
            'kms' => AttributeType::Mixed,
            'series' => AttributeType::Mixed,
            'state' => AttributeType::Mixed,
            'year' => AttributeType::Number,
            'city' => AttributeType::Mixed,
            'transmission' => AttributeType::Mixed,
            'body' => AttributeType::Mixed,
            'badge' => AttributeType::Mixed,
            'car_colour' => AttributeType::Mixed,
            'doors' => AttributeType::Number,
            'fuel_type' => AttributeType::Mixed,
            'fwd_rwd' => AttributeType::Mixed,
            'spare_key' => AttributeType::Mixed,
            'log_books' => AttributeType::Mixed,
            'rego' => AttributeType::Mixed,
            'rego_expiry' => AttributeType::Mixed,
            'sunroof' => AttributeType::Mixed,
            'sat_nav' => AttributeType::Mixed,
            'leather' => AttributeType::Mixed,
            'seats' => AttributeType::Number,
            'finance_value' => AttributeType::Number,
            'estimate' => AttributeType::Mixed,
            'inspector_email' => AttributeType::Mixed,
            'sales_consultant_email' => AttributeType::Mixed,
            'latest_pricing' => AttributeType::Number,
        ];
    }

    public function getEngineType()
    {
        if (empty($this->fuel_type)) {
            return null;
        }

        $fuel_type = strtolower($this->fuel_type);
        if (in_array($fuel_type, ['petrol', 'diesel', 'gas', 'electric'])) {
            return $fuel_type;
        } else {
            NegotiatorPlugin::log(sprintf('Unknown fuel type: %s. RunBikeStop ID: %d', $this->fuel_type, $this->id), LogLevel::Warning, true);
            return null;
        }
    }

    public function getDriveTrain()
    {
        if(empty($this->fwd_rwd)) {
            return null;
        }

        $fwd_rwd = strtoupper($this->fwd_rwd);
        if ($fwd_rwd == '2WD') {
            return '2WD';
        } elseif ($fwd_rwd == '4X4') {
            return '4X'; //it's not typo
        } else {
            NegotiatorPlugin::log(sprintf('Unknown drive train (fwd_rwd): %s. RunBikeStop ID: %d', $this->fwd_rwd, $this->id), LogLevel::Warning, true);
            return null;
        }
    }

    public function getKms()
    {
        if(empty($this->kms)) {
            return null;
        }

        $kms = str_replace(',', '', $this->kms);
        if(!is_numeric($kms)) {
            NegotiatorPlugin::log(sprintf('Wrong kms value: %s. RunBikeStop ID: %d', $this->kms, $this->id), LogLevel::Warning, true);
            return null;
        } else {
            return (float)$kms;
        }
    }

    public function getRegoExpiry()
    {
        if(empty($this->rego_expiry)) {
            return null;
        }

        $ts = strtotime($this->rego_expiry);
        if($ts) {
            return date('Y-m-d', $ts);
        } else {
            return null;
        }
    }

    public function getColour()
    {
        if(empty($this->car_colour)) {
            return null;
        }

        $colour = strtolower($this->car_colour);
        if(in_array($colour, ['silver', 'black', 'grey', 'white'])) {
            return $colour;
        } else {
            return 'other';
        }
    }

    public function getTransmission()
    {
        if(empty($this->transmission)) {
            return null;
        }

        $transmission = strtolower($this->transmission);
        if(in_array($transmission, ['auto', 'manual'])) {
            return $transmission;
        } else {
            NegotiatorPlugin::log(sprintf('Wrong transmission value: %s. RunBikeStop ID: %d', $this->transmission, $this->id), LogLevel::Warning, true);
            return null;
        }
    }

    public function getDoors()
    {
        if(empty($this->doors)) {
            return null;
        }

        if (preg_match('/^(\d+)(dr)?$/i', $this->doors, $m)) {
            return (int)$m[1];
        } else {
            NegotiatorPlugin::log(sprintf('Wrong doors value: %s. RunBikeStop ID: %d', $this->doors, $this->id), LogLevel::Warning, true);
            return null;
        }
    }

    public function isDriveIn()
    {
        return $this->inspector_email === 'drivein@areyouselling.com.au';
    }

    public function isLocalMech()
    {
        return $this->inspector_email === 'localmech@areyouselling.com.au';
    }
}