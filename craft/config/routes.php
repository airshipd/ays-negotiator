<?php

/**
 * Dynamic Site Routes
 *
 * If you’d prefer to set up your site routes in a file as opposed to Settings > Routes in the CP,
 * you can define them here.  Craft will check both places for dynamic site routes.
 *
 * Each route will take up one element in the array returned by this file.
 * The array keys are your URL patterns, and the values are the templates that should get loaded.
 *
 * The URL patterns are regular expressions. If you want to capture portions of the URL and
 * make them available to your template, use named subpatterns. For example:
 *
 *     'blog/archive/(?P<year>\d{4})' => 'blog/_archive',
 *
 * That example would match URIs such as "blog/archive/2012", and pass the request along to
 * the blog/_archive template, providing it a ‘year’ variable set to the value “2012”.
 */

return array(

  'offer/(?P<id>\d+)' => 'offer/pending',
  'offer/(?P<id>\d+)/view' => 'offer/view',
  'offer/(?P<id>\d+)/finalise/(?P<answer>[^\/]+)' => ['action' => 'negotiator/offer/finalise'],
  'report/(?P<id>\d+)' => 'report/inspectionReport',

  //API routes
  'api/inspections' => ['action' => 'negotiator/api/inspections'],
  'api/inspection/(?P<id>\d+)' => ['action' => 'negotiator/api/inspection'],
  'api/offer/(?P<id>\d+)' => ['action' => 'negotiator/api/offer'],
);
