Confusional -- the super-easy conference planner
================================================

What?
-----

Confusional is an easy to use conference planner aimed at easing the
pain people who make time-tables go through. It runs entirely in the
browser, occasionally saving small chunks of JSON on the server.
One of the design goals is to make it trivial to integrate
Confusional with your existing web app or cms.

Integration
-----------

Here's how you can go about integrating Confusional in your
existing application.

* Write a key-value store (see valuestore.php for an example) that
  stores key-value pairs and returns the value associated with a
  requested key. Your key-value store should also take care of
  authenticating users for write access etc.
* Edit index.html and css/nonameskin.css to suit your design etc.

TODO
----

* Have a non-admin mode :P
* Use parent cms to list accepted / top rated talks
* Allow multiple instances of Planner on the same page
  (multiple dates)
* Write a drupal plugin
