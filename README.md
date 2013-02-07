# force.js

A Node.js tool to make interacting with the Salesforce.com
REST API a breeze.

## Getting Started

The dependencies are all in `package.json`. Install with:

	npm install

Then use with:

	var sfdc = require('./lib/force.js');
	var production = new sfdc.Connection( urls, and, oauth, info );
	production.authorize( user, credentials );
	production.query( 'select id from lead' ).then( callback );
	production.test('BigImportantTest').then( callback );

## Documentation

	new sfdc.Connection( login_url, resource_url, client_id, client_secret )

The constructor for a connection to a particular
Salesforce.com instance.

 * `login_url`
   * `login.salesforce.com` for production
   * `test.salesforce.com` for sandboxes
   * something else for pre-release, etc.
 * `resource_url`
   * the instance url, e.g.
     * `ssl.salesforce.com`
     * `na1.salesforce.com`
     * `cs1.salesforce.com`
 * `client_id`
 * `client_secret`
   * the OAuth credentials for this application
   * see [Setting up Authorization]()

Returns a Connection object.

	#authorize( username, password, token )

Perform username-password flow OAuth authorization.

 * `username`
 * `password`
   * the Salesforce.com credentials for the instance
 * `token`
   * the Salesforce.com security token

Returns a promise which resolves on success.

	#listversions()

List the versions of the Salesforce API supported by the
instance.

Returns a promise which resolves with the list of version
information.

	#listResources()

List the resources available.

Returns a promise which resolves with the resource
information.

	#listRecent()

List the logged-in user's most recently accessed records.
Returns a promise which resolves with the list of records.

	#listSObjects()

List the sObject types available.

Returns a promise which resolves with the sObject
information.

	#query( soql )

Performs a SOQL query.

 * `soql`
   * the SOQL query to execute

Returns a promise which resolves with the list of results.

	#search( sosl )

Performs a SOSL search.

 * `sosl`
   * the SOSL query to execute

Returns a promise which resolves with the list of results.

	#describe( type )

Get the describe information for an sObject.

 * `type`
   * the sObject type to describe

Returns a promise which resolves with the describe
information.

	#insert( type, data )

Create a new sObject record.

 * `type`
   * the type of sObject to create
 * `data`
   * JSON encoded field information for the sObject

Returns a promise which resolves with the Id of the newly
created sObject.

	#test( apex_class_name )

Run an Apex test.

 * `apex_class_name`
   * the name of the Apex test class to execute

Returns a promise with resolves with the results of the
test.

	#get( path )

Get a REST resource through the Connection.

	#post( path, data )

Post to a REST resource through the Connection.

Recursive Resources
-------------------

Because of the somewhat recursive nature of the tooling,
chatter and connect resources, they are implemented with a
JavaScript prototype of the Connection.  Thus, most of the
methods available on the base Connection are available on
these resources.  For example:

	dev.tooling.listSObjects().then( callback );

	dev.tooling.insert( tooling_object, data );

	dev.chatter.get('/feeds').then( callback );

	dev.connect.get('/communities').then( callback );

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/gruntjs/grunt).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Andrew Couch  
Licensed under the MIT license.
