var express = require( 'express');

var app = express();

app.get('/', function (req, res) {
    res.contentType('application/json');
    res.send(JSON.stringify(['Kalle Kula', 'Jonte Lilltroll']));
});

var port = process.env.PORT || 5000;
console.log("Listening on port " + port);
app.listen(port);
