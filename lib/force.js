"use strict";
/*
 * force.js
 * https://github.com/couchand/force-js
 *
 * Copyright (c) 2013 Andrew Couch
 * Licensed under the MIT license.
 */

// Nodejs libs
var https       = require('https'),
    querystring = require('querystring'),
    promise     = require('node-promise');

var RECURSIVE_RESOURCES = {
  'chatter': true,
  'commerce': false,
  'connect': true,
  'tooling': true
};

function nicepost(host,path,data,callback){
  var post_data = querystring.stringify(data);
  var post_options = {
    host: host,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };
  var req = https.request(post_options,function(res){
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          callback(chunk);
      });
  });
  req.on('error',console.log);
  req.write(post_data);
  req.end();
  return req;
}

function oauthget(host, path, token) {
  var buffer = '';
  var waiting = new promise.Deferred();
  var get_options = {
    host: host,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };
  https.request(get_options, function(res) {
    res.on('data', function(data) {
      buffer = buffer + data;
    });
    res.on('end', function(){
      waiting.resolve(JSON.parse(buffer));
    });
  }).end();
  return waiting;
}

var Connection = exports.Connection = function(login_url, resource_url, client_id, client_secret) {
  this.login_url = login_url;
  this.resource_url = resource_url;
  this.client_id = client_id;
  this.client_secret = client_secret;
  this.api_version = 'v26.0';
  this.base_path = '/services/data/';

  var Proxy = function() {};
  var that = Proxy.prototype = this;
  var RecursiveResource = function(res){
    this.recursive_resource_name = res;
  };
  var proto = RecursiveResource.prototype = new Proxy();
  proto.get = function(path) {
    return that.get( '/' + this.recursive_resource_name + path );
  };
  proto.post = function(path, data) {
    return that.post( '/' + this.recursive_resource_name + path, data );
  };
  // block methods that don't make sense
  proto.authorize =
  proto.listRecent =
  proto.search =
  proto.test = function () {
    var proceed = new promise.Deferred();
    proceed.resolve();
    return proceed;
  };

  for ( var res in RECURSIVE_RESOURCES ) {
    if ( RECURSIVE_RESOURCES[res] ) {
      this[res] = new RecursiveResource(res);
    }
  }

  this.listVersions().then(function(versions) {
    if ( versions && versions.length && versions[versions.length-1] ) {
      that.api_version = 'v' + versions[versions.length-1].version;
    }
  });

  // Tooling extensions
  var tooling = this.tooling;

  this.tooling.pollForDeployment = function(id, deploymentRequest) {
    tooling.getSObject('containerasyncrequest', id).then(function(res) {
      if ( res['State'] === 'Queued' ) {
        deploymentRequest.progress( 'Deployment ' + res.Id + ' still queued.' );
        tooling.pollForDeployment( id, deploymentRequest );
      }
      else {
        if ( 'Completed' === res['State'] ) {
          deploymentRequest.resolve(res);
        }
        else {
          deploymentRequest.reject(res);
        }
      }
    });
  };

  this.tooling.deploy = function(container_id, is_check) {
    var deploymentRequest = new promise.Deferred();
    tooling.insert('ContainerAsyncRequest', {
      'MetadataContainerId': container_id,
      'IsCheckOnly': is_check
    }).then(function(deploymentId){
      deploymentRequest.progress('Deployment Id: ' + deploymentId);
      tooling.pollForDeployment(deploymentId, deploymentRequest);
    });
    return deploymentRequest;
  };
};

Connection.prototype.authorize = function(username, password, token) {
  var that = this;
  var waiting = new promise.Deferred();
  nicepost(this.login_url, '/services/oauth2/token', {
    grant_type: 'password',
    client_id: this.client_id,
    client_secret: this.client_secret,
    username: username,
    password: password + token
  }, function(result) {
    that.access_token = JSON.parse(result)["access_token"];
    waiting.resolve();
  });
  return waiting;
};

Connection.prototype.get = function(path) {
  return oauthget(this.resource_url, this.base_path + this.api_version + path, this.access_token);
};

Connection.prototype.post = function(path, data) {
  var buffer = '';
  var waiting = new promise.Deferred();
  var post_data = JSON.stringify(data);
  var post_options = {
    host: this.resource_url,
    path: this.base_path + this.api_version + path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': post_data.length,
      'Authorization': 'Bearer ' + this.access_token
    }
  };
  var req = https.request(post_options,function(res){
      res.setEncoding('utf8');
      res.on('data', function (data) {
        buffer = buffer + data;
      });
      res.on('end', function(){
        waiting.resolve(JSON.parse(buffer));
      });
  });
  req.on('error',console.log);
  req.write(post_data);
  req.end();
  return waiting;
};

// The one method you don't need to be authorized for
Connection.prototype.listVersions = function() {
  return oauthget(this.resource_url, this.base_path);
};

Connection.prototype.listResources = function() {
  return this.get('/');
};

Connection.prototype.listRecent = function() {
  return this.get('/recent');
};

Connection.prototype.listSObjects = function() {
  return this.get('/sobjects').then(function(res) {
    return res['sobjects'];
  });
};

Connection.prototype.getSObject = function(type, id) {
  return this.get('/sobjects/' + type + '/' + id);
};

Connection.prototype.search = function(query) {
  return this.get('/search?q=' + querystring.escape(query));
};

Connection.prototype.query = function (query) {
  var path = '/query?q=' + querystring.escape(query);
  return this.get(path).then(function(res){
    return res["records"];
  });
};

Connection.prototype.insert = function (type, data) {
  var path = '/sobjects/' + type;
  return this.post(path, data).then(function(res){
    return res["id"];
  });
};

Connection.prototype.describe = function(type) {
  var path = '/sobjects/' + type + '/describe';
  return this.get(path);
};

Connection.prototype.pollForResults = function(queueitemid, callback){
  var that = this;
  this.query("SELECT Id, Status FROM ApexTestQueueItem WHERE Id = '" + queueitemid + "'").then(function(res){
    if ( res[0]["Status"] !== 'Aborted' && res[0]["Status"] !== 'Completed' && res[0]["Status"] !== 'Failed' ){
      that.pollForResults(queueitemid, callback);
    }
    else {
      that.query("SELECT Id, Outcome, ApexClass.Name, MethodName FROM ApexTestResult WHERE QueueItemId = '" + queueitemid + "'").then(callback);
    }
  });
};

Connection.prototype.testId = function(apexclassid) {
  var that = this;
  var waiting = new promise.Deferred();
  this.insert('ApexTestQueueItem', { ApexClassId: apexclassid }).then(function(newid){
    that.pollForResults(newid, function(res) {
      waiting.resolve(res);
    });
  });
  return waiting;
};

Connection.prototype.test = function(apexclassname) {
  var that = this;
  return this.query('select id, name from apexclass where name = \'' + apexclassname + '\'').then(function(res){
    return res[0].Id;
  }).then(function(id){
    return that.testId(id);
  });
};
