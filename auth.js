// authorization to my prerelease box.
// please don't steal my client secret.
// it's only good for another month anyway.
// note my password is not here, but my
// most recent security token is.
var sfdc = require('./lib/force.js');
var c = new sfdc.Connection('prerellogin.pre.salesforce.com','prerelna1.pre.salesforce.com','3MVG9lKcPoNINVBIuX965tJtsFOmtFJxx0sE0Z2_dBo1kuM7D2DvM51RWN8neZ7Bpckw7V2aVq74sKSjnluir','4377211423215529444');
c.authorize('couchand+spring13@gmail.com','','La8Mu2IqdEuQpqrjggHuIvd9v').then(function(){console.log('in');});


var mystuff = {}
c.tooling.insert('metadatacontainer',{'name':'fod'}).then(function(id){mystuff.container = id;});

c.tooling.query('select id, body from apexclass where name = \'foobar\'').then(function(res){mystuff.body = res[0].Body;mystuff.cls = res[0].Id;});

mystuff.body2 = mystuff.body.substr(0,mystuff.body.length-1)+"\n\tpublic void doNothing()\n\t{\n\t}\n}"

c.tooling.insert('apexclassmember',{'metadatacontainerid':mystuff.container,'contententityid':mystuff.cls,'body':mystuff.body2}).then(function(id){mystuff.acm = id;console.log(id);});

c.tooling.getSObject('apexclassmember',mystuff.acm).then(console.log)

c.tooling.deploy(mystuff.container,true).then(console.log)

c.tooling.getSObject('apexclassmember',mystuff.acm).then(console.log)

c.tooling.getSObject('apexclassmember',mystuff.acm).then(function(res){mystuff.st = res.SymbolTable;});


//now try a failed deployment!
// watch node.js crash!
//then try again!

c.tooling.deploy('1dcx000000000BKAAY',true).then(console.log,function(err){console.log('err!',err.ErrorMsg,err.CompilerErrors);});

