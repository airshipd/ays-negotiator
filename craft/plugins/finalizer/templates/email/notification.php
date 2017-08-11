<h1><?php echo $sections['Customer Details']['Customer Name']?> has finalized a Sale</h1>

<?php

foreach($sections as $sectionTitle => $sectionFields) {
  echo "<h2>" . $sectionTitle . "</h2>";
  foreach ($sectionFields as $field => $value) {
    if($field == 'Rep Signature String' || $field == 'Customer Signature String') {
      echo "<p>" . str_replace(' String','',$field) . ":</p><p><img style='width:200px;' src='" . $value . "'></p>";
    } else {
      echo "<p>" . $field . ': ' . $value."</p>";
    }
  }
}






?>
