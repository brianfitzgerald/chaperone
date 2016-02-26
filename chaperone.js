var http = require('http');
var express = require('express');
var program = require('commander');
var github = require('octonode');
var fs = require('fs');
var Botkit = require('Botkit');
var os = require('os');

program
	.version('0.0.1')
	.option('-a, --add <username>', 'Add single user')
	.option('-i, --info', 'Display repo information')
	.option('-j, --JSON <filename>', 'Parse a JSON file for members to add')
	.option('-c, --CSV <filename>', 'Parse a CSV file for members to add')
	.parse(process.argv);


var params = JSON.parse(fs.readFileSync('config.json', 'utf8'));


/*
	Slack bot integration
*/

var controller = Botkit.slackbot();

var bot = controller.spawn({
    token: params.slack_token
}).startRTM();


controller.hears(['invite me (.*)', 'sign me up (.*)', 'invite (.*)'], 'direct_message', function (bot, message) {
	var matches = message.text.match(/invite (.*)/i);
	var username = matches[1];

	console.log(username + " signed up");
	org.addMember(username, {}, function (err, data, headers) {
		if (err) console.log(err);
		if (data) {
			console.log(data);
			bot.reply('You\'re in! Now, check out our projects here: https://github.com/mizzou-hackers/');
		}
	});
});

controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot, message) {
    controller.storage.users.get(message.user,function(err, user) {
		bot.reply(message,'What\'s good my man.');
    });
});

controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user,function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user,function(err, id) {
            bot.reply(message,'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot, message) {

    bot.startConversation(message,function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    },3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');

});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}


/*
	Github integration
*/

var client = github.client(params.github_token);
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
