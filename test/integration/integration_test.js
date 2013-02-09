var force_js = require('../../lib/force.js');
var creds = require('./creds.js');

/*jshint strict:false */
module.exports['Integration failure'] = {
  setUp: function(done) {
    this.credentials = {};
    for ( var prop in creds ) {
      this.credentials[prop] = creds[prop];
    }
    done();
  },
  'No token': function(test) {
    test.expect(1);
    var creds_minus_token = this.credentials;
    creds_minus_token['token'] = '';

    force_js.connect( creds_minus_token ).then(function(c) {
      test.ok(false, 'there should have been an authentication failure');
      test.done();
    }, function(err) {
      test.ok(err.indexOf('token'));
      test.done();
    });
  },
  'No password': function(test) {
    test.expect(1);
    var creds_minus_pw = this.credentials;
    creds_minus_pw['password'] = '';

    force_js.connect( creds_minus_pw ).then(function(c) {
      test.ok(false, 'there should have been an authentication failure');
      test.done();
    }, function(err) {
      test.ok(err.indexOf('grant'));
      test.done();
    });
  }
};

module.exports['Integration'] = {
  setUp: function (done) {
    var that = this;
    force_js.connect( creds ).then(function(c) {
      that.conn = c;
      done();
    });
  },
  'REST API' : {
    'list resources, objects, etc.': function(test) {
      test.expect(11);
      var conn = this.conn;

      conn.listVersions().then(function(versions) {
        test.ok(versions instanceof Array);

        return conn.listRecent();
      }).then(function(recent) {
        test.ok(recent instanceof Array);

        return conn.listResources();
      }).then(function(resources) {
        test.ok(resources.hasOwnProperty('sobjects'));
        test.ok(resources.hasOwnProperty('search'));
        test.ok(resources.hasOwnProperty('query'));
        test.ok(resources.hasOwnProperty('chatter'));
        test.ok(resources.hasOwnProperty('connect'));
        test.ok(resources.hasOwnProperty('tooling'));

        return conn.listSObjects();
      }).then(function(sobjects) {
        test.ok(sobjects instanceof Array);
        test.ok(sobjects[0].hasOwnProperty('name'));

        return conn.describe(sobjects[0].name);
      }).then(function(describe) {
        test.ok(describe.hasOwnProperty('name'));

        test.done();
      });
    },
    'make and find sobjects': function (test) {
      test.expect(20);
      var conn = this.conn;
      var contact_data = {
        'FirstName': 'Bruce',
        'LastName': 'Wayne',
        'Phone': '666-420-4242'
      };
      var account_data = {
        'Name': 'Wayne Industries'
      };

      conn.insert('Account', account_data).then(function(account_id) {
        test.ok(account_id);
        account_data.Id = account_id;
        contact_data.AccountId = account_id;

        return conn.insert('Contact', contact_data);
      }).then(function(contact_id) {
        test.ok(contact_id);
        contact_data.Id = contact_id;

        return conn.query('select Id, Name from Account where Id = \'' + account_data.Id + "'");
      }).then(function(accounts) {
        test.ok(accounts);
        test.equal(accounts.length, 1);
        return accounts[0];
      }).then(function(new_account) {
        test.equal(new_account.Name, account_data.Name);
        test.equal(new_account.Id, account_data.Id);
      }).then(function() {

        return conn.query('select Id, AccountId, FirstName, LastName, Phone from Contact where Id = \'' + contact_data.Id + "'");
      }).then(function(contacts) {
        test.equal(contacts.length, 1);
        return contacts[0];
      }).then(function(new_contact) {
        test.equal(new_contact.FirstName, 'Bruce');
        test.equal(new_contact.LastName, 'Wayne');
        test.equal(new_contact.Phone, '666-420-4242');
        test.equal(new_contact.AccountId, account_data.Id);
        test.equal(new_contact.Id, contact_data.Id);

        return conn.update('contact', contact_data.Id, { 'Phone': '123-456-7890' });
      }).then(function() {

        return conn.getSObject('contact', contact_data.Id);
      }).then(function(new_contact) {
        test.equal(new_contact.Id, contact_data.Id);
        test.equal(new_contact.Phone, '123-456-7890');

        return conn.search('find {Bruce Wayne} returning Contact (Account.Name)');
      }).then(function(batmen) {
        test.equal(batmen.length, 1);
        return batmen[0];
      }).then(function(batman) {
        test.equal(batman.Account.Name,'Wayne Industries');

        return conn.destroy('account', account_data.Id);
      }).then(function() {

        return conn.query('select Id from Account where Id = \'' + account_data.Id + "'");
      }).then(function(accounts) {
        test.ok(accounts);
        test.equal(accounts.length, 0);

        return conn.destroy('contact', contact_data.Id);
      }).then(function() {

        return conn.query('select Id from Contact where Id = \'' + contact_data.Id + "'");
      }).then(function(contacts) {
        test.ok(contacts);
        test.equal(contacts.length, 0);

        test.done();
      });
    }
  },
  'Tooling API': {
    'validate': function(test) {
      test.expect(6);
      var tooling = this.conn.tooling;
      var data = {};

      tooling.query('select Id, Body from ApexClass').then(function(some_class) {
        test.ok(some_class.length > 1);
        return some_class[0];
      }).then(function(some_class) {
        data.classId = some_class.Id;
        data.classBody = some_class.Body;

        return tooling.insert('MetadataContainer', { 'Name': 'Integration deployment test' });
      }).then(function(new_id) {
        test.ok(new_id);
        data.containerId = new_id;

        return tooling.insert('ApexClassMember', {
          'MetadataContainerId': data.containerId,
          'ContentEntityId': data.classId,
          'Body': data.classBody
        });
      }).then(function(new_id) {
        test.ok(new_id);
        data.classMemberId = new_id;

        return tooling.deploy(data.containerId, true);
      }).then(function(results) {
        test.equal(results.State, 'Completed');

        return tooling.destroy('ApexClassMember', data.classMemberId);
      }).then(function() {

        return tooling.insert('ApexClassMember', {
          'MetadataContainerId': data.containerId,
          'ContentEntityId': data.classId,
          'Body': 'THIS is NOT legal APEX and so SHOULD fail.'
        });
      }).then(function(new_id) {
        test.ok(new_id);
        data.classMemberId = new_id;

        return tooling.deploy(data.containerId, true);
      }).then(function(){
        test.ok(false, 'The deployment check should have failed.');
      }, function(results) {
        test.equal(results.State, 'Failed');

        return tooling.destroy('ApexClassMember', data.classMemberId);
      }).then(function() {

        return tooling.destroy('MetadataContainer', data.containerId);
      }).then(function() {

        test.done();
      });
    }
  }
};
