<?php
$errors = '';
$myemail = 'radionicsradio@hotmail.com';
if(empty($_POST['username']) || empty($_POST['thought']) || empty($_POST['frequencies'])) {
  $errors .= "\n Error: all fields are required";
}
$name = $_POST['username'];
$email_address = $_POST['thought'];
$message = $_POST['frequencies'];
if(empty($errors))
{
  $to = $myemail;
  $email_subject = "$name";
  $email_body = "You have received a new message. ".
    "\n Username: $name\nThought: $thought\nFrequencies:\n$message";
  $headers = "From: $myemail\n";
  mail($to, $email_subject, $email_body, $headers);
  //redirect to the 'thank you' page
  echo $to;
  echo $email_body;
}
?>
