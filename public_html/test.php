<?php

$data = "Or9%2btArvhpwAEkjzPHRGjM7QQ6Z%2b2Ny%2frbZgBElGiqVU03oOOl6g%2fl7ZBK1PO2S0%2bZjTqo3zdt8rMeK4gZKyhSwBWYcDHcmqfFZNE18By6ZZn9K9dbRqkRBUCbLvjAUrLTM40pPgPRtUvKXfV5vALg%3d%3d";
$key = "/5U7qD7JLyZbWLNszD2SdHFIC7Jy3n5DGUBgLtzUsFc=";

function decrypt($data, $key) {
    $data = base64_decode(urldecode($data));
    $iv = substr($data, 0, 16);
    $data = substr($data, 16, strlen($data) - 16);
    return openssl_decrypt($data, 'aes-256-cbc', base64_decode($key), OPENSSL_RAW_DATA, $iv);
}

var_dump(json_decode(decrypt( $data, $key )));
?>

<ul>
  <li><a href="index.php?p=actions/ServeUp/api/login&hash=Or9%2btArvhpwAEkjzPHRGjM7QQ6Z%2b2Ny%2frbZgBElGiqVU03oOOl6g%2fl7ZBK1PO2S0%2bZjTqo3zdt8rMeK4gZKyhSwBWYcDHcmqfFZNE18By6ZZn9K9dbRqkRBUCbLvjAUrLTM40pPgPRtUvKXfV5vALg%3d%3d">Test API Login</a></li>
  <li><a href="index.php?p=actions/ServeUp/api/UpdateUserCompletions&hash=mWiN71iiRd7to6R4aCFz2bct2Q2d2Yh8hJWaKhf2%2b83EK4g%2f1XBORlYPEmeP9cWkHjrozEONz4iR8khRhIP8%2bx2LRtMaULUZfzvnkrAEke%2f55gc4HNSgABAKs2XVKP1L98YUHribLcdA3pMpq43QbwQRIUIAGo8O5ez5NxEo9X%2bav1uQlevgEpkhgwpFoWvX8yG6h%2bShiByKTXhDN4kMPI3lINx2hSysmuGhVrRARudSB6Z1EMsD0maRztsO3g3jcIIN87o4kLn%2b%2fOyfXx%2fwkpwQEECL%2fntYm95KID1vHrAIPVo3ehhrpnisZKPJ0Tce0nKxoHAzIRUYhpf%2bH1JEig%3d%3d">Test API completion data sync</a></li>
</ul>
