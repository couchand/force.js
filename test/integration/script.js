var force_js = require('../../lib/force.js');
var creds = require('./creds.js');

/*jshint strict:false */
module.exports = {
  setUp: function (done) {
    var conn = this.conn = new force_js.Connection( creds.login_url, creds.resource_url, creds.client_key, creds.client_secret );
    conn.authorize( creds.username, creds.password, creds.token ).then(function() {
      done();
    });
  },
  'make and find sobjects': function (test) {
    test.expect(18);
    var conn = this.conn;
    var contact_data = {
      'FirstName': 'Bruce',
      'LastName': 'Wayne'
    };
    var account_data = {
      'Name': 'Wayne Industries'
    };
    conn.insert('Account', account_data).then(function(account_id) {
      test.ok(account_id);
      console.log(account_id);
      account_data.Id = account_id;
      contact_data.AccountId = account_id;
      return conn.insert('Contact', contact_data);
    }).then(function(contact_id) {
      test.ok(contact_id);
      console.log(contact_id);
      contact_data.Id = contact_id;
      return conn.query('select Id, Name from Account where Id = \'' + account_data.Id + "'");
    }).then(function(accounts) {
console.log(accounts);
      test.ok(accounts);
      test.equal(accounts.length, 1);
      return accounts[0];
    }).then(function(new_account) {
console.log(new_account);
      test.equal(new_account.Name, account_data.Name);
      test.equal(new_account.Id, account_data.Id);
    }).then(function() {
      return conn.query('select Id, AccountId, FirstName, LastName from Contact where Id = \'' + contact_data.Id + "'");
    }).then(function(contacts) {
      test.equal(contacts.length, 1);
      return contacts[0];
    }).then(function(new_contact) {
      test.equal(new_contact.FirstName, 'Bruce');
      test.equal(new_contact.LastName, 'Wayne');
      test.equal(new_contact.AccountId, account_data.Id);
      test.equal(new_contact.Id, contact_data.Id);
      test.done();
    });
  }
}
