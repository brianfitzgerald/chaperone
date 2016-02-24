var http = require('http');
var express = require('express');
var program = require('commander');
var github = require('octonode');
var fs = require('fs');

program
	.version('0.0.1')
	.option('-a, --add <username>', 'Add single user')
	.option('-i, --info', 'Display repo information')
	.option('-j, --JSON <filename>', 'Parse a JSON file for members to add')
	.option('-c, --CSV <filename>', 'Parse a CSV file for members to add')
	.parse(process.argv);


var params = JSON.parse(fs.readFileSync('config.json', 'utf8'));

var client = github.client({
	username: params.username,
	password: params.password
});
var org = client.org(params.organization);

if (program.info) {
	org.info(function (err, data, headers) {
		console.log(data);
	});
}

if (program.add) {
	console.log(program.add);
	org.addMember(program.add, {}, function (err, data, headers) {
		if (err) console.log(err);
		if (data) console.log(data);
	});
}

if (program.JSON) {
	var names = JSON.parse(fs.readFileSync(program.JSON, 'utf8'));
	program.JSON.users.forEach(function (username) {
		org.addMember(username, {}, function (err, data, headers) {
			if (err) console.log(err);
			if (data) console.log(data);
		});
	});
}
