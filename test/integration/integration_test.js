var force_js = require('../../lib/force.js');
var creds = require('./creds.js');

/*jshint strict:false */
module.exports['Integration'] = {
  setUp: function (done) {
    var conn = this.conn = new force_js.Connection( creds.login_url, creds.resource_url, creds.client_key, creds.client_secret );
    conn.authorize( creds.username, creds.password, creds.token ).then(function() {
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
  }
};
