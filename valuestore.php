<?php

/*
 * Confusional's
 *
 * Super-simple plain-file-based RESTful
 * key-value store for JSON objects.
 *
 */

/* directory to store the files in */
define('DIR', dirname(__FILE__) . '/store');
/* this helps in making sure only your
   server can generate the right hash */
define('HASHSECRET', 'blah');
/* authentication is done using HTTP Basic Auth
   set this to null to make read-only */
$allow_write = array('admin' => 'secret');


@$method = ($_POST && $_REQUEST['_method'] == 'DELETE')?
    'DELETE' : $_SERVER['REQUEST_METHOD'];

/*
 * Authenticate a request
 *
 * Always allows GET requests
 *
 * set username password pairs
 * in $allow_write for write access
 */
function authenticate($method) {
  global $allow_write;
  if(!empty($allow_write)) header('WWW-Authenticate: Basic '.
          'realm="super-simple key-value store"');

  return
    $method === 'GET' || (isset($_SERVER['PHP_AUTH_USER']) &&
    !empty($allow_write) &&
    array_key_exists($_SERVER['PHP_AUTH_USER'], $allow_write) &&
    $allow_write[$_SERVER['PHP_AUTH_USER']]
      === $_SERVER['PHP_AUTH_PW']);
}

/*
 * Hash function
 *  so that I don't have to make a
 *  list of all the illegal characters that
 *  you cannot use in the key :P
 */
function _hash($key) {
  return sha1(HASHSECRET . $key);
}

if (!authenticate($method)) {
  header('HTTP/1.1 401 Unauthorized');
  exit(2);
}

if (empty($_REQUEST['key'])) {
  header('HTTP/1.1 400 Bad Request');
  // key is mandatory in every request
  exit(3);
}
@$key = _hash($_REQUEST['key']);

// all requests other than POST require that the
// value already be there.
if ($method != 'POST' && !file_exists(DIR . '/' . $key)) {
  header('HTTP/1.1 404 Not Found');
  exit(4);
}

class ServerException extends Exception { }

try {
  // do what is asked for
  header('Content-Type: application/json; charset=utf-8');
  $output = call_user_func('handle' . $method, $key);
  // for 20x error codes always print *some* json
  if($output===null) echo 'true';
  else echo $output;

  exit(0);
} catch(ServerException $e) {
  header('HTTP/1.1 500 Internal Server Error');
  exit(1);
}


/*
 * Show a value
 */
function handleGET($key) {
  $data = file_get_contents(DIR . '/' . $key);
  if ($data === false)
    throw new ServerException();
  header('HTTP/1.1 200 OK');
  return $data;
}

/*
 * Create or overwrite a value
 */
function handlePOST($key) {
  $data = trim($_REQUEST['value']);
  if (false === file_put_contents(DIR . '/' . $key, $data))
    throw new ServerException();
  header('HTTP/1.1 201 Created');
}

/*
 * Update a value
 */
function handlePUT($key) {
  $data = trim($_REQUEST['value']);
  if (false === file_put_contents(DIR . '/' . $key, $data))
    throw new ServerException();
  header('HTTP/1.1 200 OK');
}

/*
 * Delete a value
 */
function handleDELETE($key) {
  if (!unlink(DIR . '/' . $key))
    throw new ServerException();
  header('HTTP/1.1 410 Gone'); // poof!
}
