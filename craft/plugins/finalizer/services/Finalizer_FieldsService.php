<?php
namespace Craft;

class Finalizer_FieldsService extends BaseApplicationComponent  {
  public function groupFieldsByTabs($entry) {
    $tabs = $entry->getFieldLayout()->getTabs();
    $entryFieldValues = $entry->getContent()->getAttributes();
    $grouped = array();

    forEach ($tabs as $tab) {
      $tabContent = array();
      $fields = $tab->getFields();
      foreach ($fields as $field) {
        $field = $field->getField();
        $fieldHandle = $field['handle'];
        $fieldName = $field['name'];
        $fieldValue = $entryFieldValues[$fieldHandle];
        if (is_a($fieldValue, 'DateTime')) {
          $fieldValue = $fieldValue->format('d/M/Y');
        }
        $tabContent[$fieldName] = $fieldValue;
      }
      $grouped[$tab['name']] = $tabContent;
    }

    // remove fields that we don't want to show up in the final email
    unset($grouped["Car Details"]["Vehicle Photos"]);
    unset($grouped["Car Details"]["License and Registration Photos"]);
    unset($grouped["Pre Inspection Details"]["Mechanic"]);
    unset($grouped["Pre Inspection Details"]["Inspection Status"]);
    return $grouped;
  }

  function getCustomerName($entry) {
    return $entry->customerName;
  }

  function getStaffName($entry) {
    return $entry->repName;
  }
}
