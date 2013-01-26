var force_js = require('../lib/force.js')
  , https    = require('https');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['Connection'] = {
  setUp: function(done) {
    https.request = function (options, callback) {
      return {
        'on': function() {},
        'write': function() {},
        'end': function() {
          callback({
            'setEncoding': function() {},
            'on': function(evt,callback) {
              if ( evt === 'data' ) {
                callback(JSON.stringify({"access_token":"foobar"}));
              }
            }
          });
        }
      };
    };
    done();
  },
  'no args': function(test) {
    test.expect(1);
    var conn = new force_js.Connection();
    test.ok(conn, 'should be empty');
    test.done();
  },
  'four args': function(test) {
    test.expect(4);
    var login = {};
    var resource = {};
    var client_id = {};
    var client_secret = {};
    var conn = new force_js.Connection(login, resource, client_id, client_secret);
    test.strictEqual(conn.login_url, login, 'the login url should be loaded');
    test.strictEqual(conn.resource_url, resource, 'the resource url should be loaded');
    test.strictEqual(conn.client_id, client_id, 'the client id should be loaded');
    test.strictEqual(conn.client_secret, client_secret, 'the client secret should be loaded');
    test.done();
  },
  'authorize': function(test) {
    test.expect(1);
    var login = {};
    var resource = {};
    var client_id = {};
    var client_secret = {};
    var conn = new force_js.Connection(login, resource, client_id, client_secret);
    var username = 'USERNAME';
    var password = 'PASSWORD';
    var token = 'TOKEN';
    conn.authorize(username, password, token, function() {
     test.equal(conn.access_token, 'foobar', 'the access token should be parsed from the response');
     test.done();
    });
  }
};