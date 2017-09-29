<h2><?php echo $sections['Customer Details']['Customer Name']?> has finalized a Sale</h2>

<?php

foreach($sections as $sectionTitle => $sectionFields) {
  echo "<h3>" . $sectionTitle . "</h3>";
  foreach ($sectionFields as $field => $value) {
    if($field == 'Rep Signature String' || $field == 'Customer Signature String') {
      echo "<p>" . str_replace(' String','',$field) . ":</p><p><img style='width:200px;' src='" . $value . "'></p>";
    } else {
      echo "<p>" . $field . ': ' . $value."</p>";
    }
  }
}

echo "<h2>License and Registration Photos</h2>";

foreach($image_urls as $url) {
  echo "<p><img style='width:360px;margin:20px 0;' src='" . $url . "'></p>";
}

?>

<h2>Contract of Sale</h2>
<a href="<?php echo $contractUrl ?>">Download Contract of Sale</a>

<h2>Internal Record</h2>
<a href="<?php echo $recordUrl ?>">Download Internal Record</a>
