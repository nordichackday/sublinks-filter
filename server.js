var express = require( 'express');
var request = require('superagent');
var fs = require('fs');

var names = {};
JSON.parse(fs.readFileSync('names.json', 'utf8')).forEach(function(name) {
    names[name] = true;
});


var getStartSeconds = function(str) {
    var parts = str.split(':');
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[1])
};


var getSubtexts = function(webrtt) {
    var lines = webrtt.split(/\r?\n/);
    var subtexts = [];
    var state = 0;
    var subtext = {};
    subtext.lines = [];
    for (var i=0; i<lines.length; i++) {
        var line = lines[i];
        switch(state) {
            case 0:
                subtext.id = line;
                state = 1;
                break;
            case 1:
                subtext.time = getStartSeconds(line);
                state = 2;
                break;
            default:
                if (! /^\s*$/g.test(line)) {
                    subtext.lines.push(line);
                } else {
                    subtexts.push(subtext);
                    subtext = {};
                    subtext.lines = [];
                    state = 0;
                }
        }
    }
    return subtexts;
};

var getKeywords = function(subtexts) {
    var keywords = [];
    for (var i=0; i<subtexts.length; i++) {
        var subtext = subtexts[i];
        for (var j= 0; j<subtext.lines.length; j++) {
            var keyword = {};
            var line = subtext.lines[j];
            var words = line.split(/[^A-Za-z\u00C0-\u017F]/);
            for (var k=0; k<words.length; k++) {
                if (names[words[k]] && k<words.length+1) {
                    var nextInitial = words[k+1].charAt(0);
                    if (nextInitial === nextInitial.toUpperCase()) {
                        keyword.time = subtext.time;
                        keyword.word = words[k] + ' ' + words[k+1];
                        keywords.push(keyword);
                        keyword = {};
                        i++;
                    }
                }
            }
        }
    }
    return keywords;
};


var app = express();

app.get('/', function (req, response) {
    if (req.query.sublink_url === undefined) {
        response.send('You loose');
        return;
    }

    console.log(req.query.sublink_url);
    request.get(req.query.sublink_url).end(function(err, sublink) {
        if (sublink.ok) {
            response.contentType('application/json');
            response.send(JSON.stringify(getKeywords(getSubtexts(sublink.text))));
        } else {
            console.log(sublink.text);
            response.send(sublink.text);
        }
    });
});

var port = process.env.PORT || 5000;
console.log("Listening on port " + port);
app.listen(port);
