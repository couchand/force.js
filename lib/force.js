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
    querystring = require('querystring');

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

  this.get = function(path, callback) {
    var buffer = '';
    var get_options = {
      host: that.resource_url,
      path: path,
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
        if (callback) {
          callback(JSON.parse(buffer));
        }
      });
    }).end();
  };

  this.post = function(path, data, callback) {
    var buffer = '';
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
          if (callback) {
            callback(JSON.parse(buffer));
          }
        });
    });
    req.on('error',console.log);
    req.write(post_data);
    req.end();
  };

  this.query = function (query, callback) {
    var path = '/services/data/v26.0/query?q=' + querystring.escape(query);
    this.get(path, function(res){
      if ( callback ) {
        callback(res["records"]);
      }
    });
  };
};
