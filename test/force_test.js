"use strict";

var force_js    = require('../lib/force.js'),
    https       = require('https'),
    querystring = require('querystring'),
    promise     = require('node-promise');

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
    var that = this;
    https.request = function (options, callback) {
      var me = this;
      that.options = options;
      return {
        'on': function() {},
        'write': function(data) {
          that.data = data;
        },
        'end': function() {
          callback({
            'setEncoding': function() {},
            'on': function(evt,callback) {
              if ( evt === 'data' ) {
                callback(JSON.stringify({"access_token":"foobar"}));
              }
              if ( evt === 'end' ){
                callback();
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
    var that = this;
    test.expect(8);
    var login = {};
    var resource = {};
    var client_id = {};
    var client_secret = {};
    var conn = new force_js.Connection(login, resource, client_id, client_secret);
    var username = 'USERNAME';
    var password = 'PASSWORD';
    var token = 'TOKEN';
    conn.authorize(username, password, token).then(function() {
     test.equal(conn.access_token, 'foobar', 'the access token should be parsed from the response');
     test.strictEqual(that.options['host'], login, 'the login url should be used for authorization');
     test.strictEqual(that.options['path'], '/services/oauth2/token', 'the path should be the token path');
     test.strictEqual(that.options['method'], 'POST', 'the method should be post');
     test.strictEqual(that.options['headers']['Content-Type'], 'application/x-www-form-urlencoded', 'the content type should be right');
     test.ok(that.options['headers'].hasOwnProperty('Content-Length'), 'the content length should be loaded');
     var params = querystring.parse(that.data);
     test.strictEqual(params.username,'USERNAME','the username should be passed');
     test.strictEqual(params.password,'PASSWORDTOKEN','the password/token should be passed');
     test.done();
    });
  },
  'get': function(test) {
    var that = this;
    test.expect(5);
    var login = {};
    var resource = {};
    var client_id = {};
    var client_secret = {};
    var conn = new force_js.Connection(login, resource, client_id, client_secret);
    conn.access_token = 'ACCESS_TOKEN';
    var resource_path = '/path/to/resource';
    var expected_path = conn.base_path + conn.api_version + resource_path;
    conn.get(resource_path).then(function(data) {
     test.strictEqual(that.options['host'], resource, 'the login url should be used for authorization');
     test.strictEqual(that.options['path'], expected_path, 'the path should be the resource path');
     test.strictEqual(that.options['method'], 'GET', 'the method should be get');
     test.strictEqual(that.options['headers']['Authorization'], 'Bearer ACCESS_TOKEN', 'the access token should be passed in the header');
     test.strictEqual(data["access_token"],'foobar', 'the results should be passed in');
     test.done();
    });
  },
  'post': function(test) {
    var that = this;
    test.expect(6);
    var login = {};
    var resource = {};
    var client_id = {};
    var client_secret = {};
    var conn = new force_js.Connection(login, resource, client_id, client_secret);
    conn.access_token = 'ACCESS_TOKEN';
    var resource_path = '/path/to/resource';
    var expected_path = conn.base_path + conn.api_version + resource_path;
    var some_data = {"FOO":"BAR"};
    conn.post(resource_path, some_data).then(function() {
     test.strictEqual(that.options['host'], resource, 'the login url should be used for authorization');
     test.strictEqual(that.options['path'], expected_path, 'the path should be the resource path');
     test.strictEqual(that.options['method'], 'POST', 'the method should be post');
     test.strictEqual(that.options['headers']['Content-Type'], 'application/json', 'the content type should be right');
     test.ok(that.options['headers'].hasOwnProperty('Content-Length'), 'the content length should be loaded');
     var params = JSON.parse(that.data);
     test.strictEqual(params["FOO"], "BAR",'the data should be passed');
     test.done();
    });
  }
};

exports["Connection advanced"] = {
  'query': function(test) {
    test.expect(2);
    var that = this;
    var query = 'SELECT foo FROM bar';
    var conn = new force_js.Connection();
    var results = { 'records': { 'Id': 'foobar' } };

    conn.get = function(path) {
      that.path = path;
      var p = new promise.Deferred();
      p.resolve(results);
      return p;
    };

    conn.query(query).then(function(records) {
      test.deepEqual(records, {"Id":"foobar"});
      test.ok(that.path.indexOf('q=SELECT+foo+FROM+bar'));
      test.done();
    });
  },
  'insert': function(test) {
    test.expect(3);
    var that = this;
    var objectType = 'Opportunity';
    var objectData = { 'Name': 'foobar' };
    var conn = new force_js.Connection();
    var results = { 'id': 'newId' };

    conn.post = function(path, data) {
      that.path = path;
      that.data = data;
      var p = new promise.Deferred();
      p.resolve(results);
      return p;
    };

    conn.insert(objectType, objectData).then(function(newId){
      test.ok(that.path.indexOf('Opportunity'));
      test.deepEqual(that.data, objectData);
      test.equal(newId, 'newId');
      test.done();
    });
  },
  'describe': function(test) {
    test.expect(2);
    var that = this;
    var objectType = 'Opportunity';
    var conn = new force_js.Connection();
    var results = { 'fields': [] };

    conn.get = function(path) {
      that.path = path;
      var p = new promise.Deferred();
      p.resolve(results);
      return p;
    };

    conn.describe(objectType).then(function(res){
      test.ok(that.path.indexOf('Opportunity/describe'));
      test.deepEqual(res, results);
      test.done();
    });
  }
};
