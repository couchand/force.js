"use strict";

function Asserter() {
  this.assertion_count = 0;
}

Asserter.prototype.ok = function(v){
  console.log('should be true:'+v);
  this.assertion_count++;
};
Asserter.prototype.equal = function(a,b){
  console.log('should be equal:'+a+'&'+b);
  this.assertion_count++;
};
Asserter.prototype.expect = function(x){
  console.log('expecting '+x+' assertions');
  this.expected = x;
};
Asserter.prototype.done = function(){
  if ( this.expected && this.expected !== this.assertion_count ) {
    console.log('expected '+this.expected+' assertions, but saw '+this.assertion_count);
  }
  console.log('done.');
};

function Test(callback) {
  this.callback = callback;
  this.asserter = new Asserter();
}

Test.prototype.run = function(context) {
  this.callback.call(context, this.asserter);
};

function Suite(setup, teardown, cases) {
  this.setup = setup || function() {};
  this.teardown = teardown || function() {};
  this.cases = cases || [];
}

Suite.prototype.run = function() {
  var that = this;
  var runCaseAndTeardown = function(this_case) {
    return function() {
      this_case.run(context);
      that.teardown.call(context);
    };
  };
  for ( var i = 0; i < this.cases.length; i++ ) {
    var this_case = this.cases[i];
    var context = {};
    this.setup.call(context, runCaseAndTeardown(this_case));
  }
};

module.exports = {
  'Test': Test,
  'Suite': Suite
};
