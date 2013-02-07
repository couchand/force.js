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


exports.Connection = function(login_url, resource_url, client_id, client_secret) {
  var that = this;
  this.login_url = login_url;
  this.resource_url = resource_url;
  this.client_id = client_id;
  this.client_secret = client_secret;
  this.api_version = 'v26.0';
  this.base_path = '/services/data/';

  this.authorize = function(username, password, token, callback) {
    nicepost(that.login_url, '/services/oauth2/token', {
      grant_type: 'password',
      client_id: that.client_id,
      client_secret: that.client_secret,
      username: username,
      password: password + token
    }, function(result) {
      that.access_token = JSON.parse(result)["access_token"];
      if (callback) {
        callback();
      }
    });
  };

  this.get = function(path) {
    var buffer = '';
    var waiting = new promise.Deferred();
    var get_options = {
      host: that.resource_url,
      path: that.base_path + that.api_version + path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + that.access_token
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
  };

  this.post = function(path, data) {
    var buffer = '';
    var waiting = new promise.Deferred();
    var post_data = JSON.stringify(data);
    var post_options = {
      host: that.resource_url,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length,
        'Authorization': 'Bearer ' + that.access_token
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

  this.query = function (query) {
    var path = '/query?q=' + querystring.escape(query);
    return this.get(path).then(function(res){
      return res["records"];
    });
  };

  this.insert = function (type, data) {
    var path = '/sobjects/' + type;
    return this.post(path, data).then(function(res){
      return res["id"];
    });
  };

  this.describe = function(type) {
    var path = '/sobjects/' + type + '/describe';
    return this.get(path);
  };

  this.pollForResults = function(queueitemid, callback){
    var that = this;
    this.query("SELECT Id, Status FROM ApexTestQueueItem WHERE Id = '" + queueitemid + "'").then(function(res){
      if ( res[0]["Status"] != 'Aborted' && res[0]["Status"] != 'Completed' && res[0]["Status"] != 'Failed' ){
        that.pollForResults(queueitemid, callback);
      }
      else {
        that.query("SELECT Id, Outcome, ApexClass.Name, MethodName FROM ApexTestResult WHERE QueueItemId = '" + queueitemid + "'").then(callback);
      }
    });
  }

  this.testId = function(apexclassid) {
    var that = this;
    var waiting = new promise.Deferred();
    this.insert('ApexTestQueueItem', { ApexClassId: apexclassid }).then(function(newid){
      that.pollForResults(newid, function(res) {
        waiting.resolve(res);
      });
    });
    return waiting;
  };

  this.test = function(apexclassname) {
    return this.query('select id, name from apexclass where name = \'' + apexclassname + '\'').then(function(res){
      return res[0].Id;
    }).then(function(id){
      return c.testId(id);
    });
  };
};
