var express = require( 'express');
var request = require('superagent');
var fs = require('fs');

var names = {};
JSON.parse(fs.readFileSync('names.json', 'utf8')).forEach(function(name) {
    names[name] = true;
});


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
                subtext.time = line;
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
    var keyword = {};
    subtexts.forEach(function(subtext) {
        subtext.lines.forEach(function(line) {
            var words = line.split(/[^A-Za-z\u00C0-\u017F]/);
            for (var i=0; i<words.length; i++) {
                if (names[words[i]] && i<words.length+1) {
                    var nextInitial = words[i+1].charAt(0);
                    if (nextInitial === nextInitial.toUpperCase()) {
                        keywords.push(words[i] + ' ' + words[i+1]);
                        i++;
                    }
                }
            }
        });
    });
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
