var express = require('express');
var apiBower = require('./bowerTest.js');
var Q = require('q');
var app = express(); 
var fs = require('fs');
var bower = require('bower');

/* example route to manage 
	http://127.0.0.1:3000/compile.js?jquery&underscore&angular&amplify
	http://127.0.0.1:3000/compile.js?jquery=1.6&underscore=2.0&angular=last&amplify=last
*/

var installPackages = function(packages) {
	var count,promises;

	count = Object.keys(packages).length;
	promises = [];

	if(count >= 1) {

		Object.keys(packages).forEach(function (val,index) {
			if(packages[val] !== '') {
				var file, lastVersion, deferred = Q.defer();

				lastVersion = false;
				file = val + "#" + packages[val];

				apiBower.searchPackage(file)
		 		.then(function (data) {
	 			if(data.exist === false) {
	 				apiBower.installPackage(file, lastVersion)
	 					.then(function (data) {
	 						apiBower.listPackage()
	 							.then(function (data) {
	 								deferred.resolve(true);
	 							}, function(err) {
	 								deferred.reject(err);
	 							})
	 					}, function(err) {
	 						deferred.reject(err);
	 					})
	 			}else if(data.exist === true) {
		 			deferred.resolve(true);			
	 			}
		 		}, function(err) {
		 			deferred.reject(err);
		 		});
			 	promises.push(deferred.promise);

			} else {
				var last, lastVersion ,deferred = Q.defer();

				lastVersion = true;
				last = val + "#last";
				
	 			apiBower.searchPackage(last)
			 		.then(function (data) {
		 			if(data.exist === false) {
		 				apiBower.installPackage(val,lastVersion)
		 					.then(function (data) {
		 						apiBower.listPackage()
		 							.then(function (data) {
		 							deferred.resolve(true);
		 							}, function (err) {
		 							deferred.reject(err);
		 							})
		 					}, function(err) {
		 						deferred.reject(err);
		 					})
		 			}else if(data.exist === true) {
		 				deferred.resolve(true);
		 			}
		 		}, function(err) {
		 			deferred.reject(err);
		 		});

			 	promises.push(deferred.promise);
			}	
		});
		
	 	return Q.all(promises);
	}
}

app.get('/', function(req, res) {

  
});
	
app.get('/compile.js', function(req, res) {
	if(apiBower.isEmptyJSON(req.query)) {
		var code = 400;
		var msg = 'Not supplied parameters';
		
		res.writeHead(code, msg, {'content-type' : 'text/plain'});
		res.end(msg);
	}else {
		var promise = installPackages(req.query);
		var files = Object.keys(req.query);

		promise.then(function(d) {
			var p;

			console.log("Search files for concat");
			p = apiBower.searchPackageInstalled(req.query);

			p.then(function(data) {
				console.log(data);
				if(data.length > 1) {
					data = apiBower.verifyMain(data)
					var file = apiBower.concat(data);
					fs.writeFileSync('compile.js', file);
					res.sendFile(__dirname + '/compile.js');
				}else if(data.length === 1) {
					var file,p;
					data = apiBower.verifyMain(data);
					file = __dirname + '/' + data[0].path;
					p = apiBower.getFile(file);
					p.then(function(f) {
						fs.writeFileSync('compile.js', f);
						
						res.sendFile(__dirname + '/compile.js');
					});
				}

			});
		}, function(err) {
			var code = 404;
			var msg = err.msg + " file:" + err.file
			
			res.writeHead(code, msg, {'content-type' : 'text/plain'});
			res.end(msg);
		})
	}

});

app.get('/compile.min.js', function(req, res) {
	if(apiBower.isEmptyJSON(req.query)) {
		var code = 400;
		var msg = 'Not supplied parameters';
		
		res.writeHead(code, msg, {'content-type' : 'text/plain'});
		res.end(msg);
	}else {
		var promise = installPackages(req.query);
		var files = Object.keys(req.query);

		promise.then(function(d) {
			var p;

			console.log("Search files for concat");
			console.log(req.query);
			p = apiBower.searchPackageInstalled(req.query);

			p.then(function(data) {
				console.log(data);
				if(data.length > 1) {
					data = apiBower.verifyMain(data)
					var file = apiBower.concat(data);
					fs.writeFileSync('compile.js', file);

					var result = apiBower.minify(__dirname + '/compile.js');

					fs.writeFileSync('compile.min.js', result.code);

					res.sendFile(__dirname + '/compile.min.js');
				}else if(data.length === 1) {
					var file,p;
					data = apiBower.verifyMain(data);
					file = __dirname + '/' + data[0].path;
					p = apiBower.getFile(file);
					p.then(function(f) {
						fs.writeFileSync('compile.js', f);

						var result = apiBower.minify(__dirname + '/compile.js');

						fs.writeFileSync('compile.min.js', result.code);
						
						res.sendFile(__dirname + '/compile.min.js');
					});
				}

			});
		}, function(err) {
			var code = 404;
			var msg = err.msg + " file:" + err.file
			
			res.writeHead(code, msg, {'content-type' : 'text/plain'});
			res.end(msg);
		})
	}
});

app.listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');
