# force.js

A Node.js tool for Salesforce.com development.

## Getting Started
Install the module with: `npm install force-js`

```javascript
var sfdc = require('force-js');
var connection = new sfdc.Connection( urls, and, oauth, info );
connection.authorize( user, credentials );
connection.query( 'select id from lead' ).then( callback );
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/gruntjs/grunt).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013 Andrew Couch  
Licensed under the MIT license.
