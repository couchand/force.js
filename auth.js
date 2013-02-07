// authorization to my prerelease box.
// please don't steal my client secret.
// it's only good for another month anyway.
// note my password is not here, but my
// most recent security token is.
var sfdc = require('./lib/force.js');
var c = new sfdc.Connection('prerellogin.pre.salesforce.com','prerelna1.pre.salesforce.com','3MVG9lKcPoNINVBIuX965tJtsFOmtFJxx0sE0Z2_dBo1kuM7D2DvM51RWN8neZ7Bpckw7V2aVq74sKSjnluir','4377211423215529444');
c.authorize('couchand+spring13@gmail.com','','La8Mu2IqdEuQpqrjggHuIvd9v',function(){console.log('in');});


