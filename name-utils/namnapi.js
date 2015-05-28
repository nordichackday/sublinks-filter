var fs = require('fs');

var namnapiNames = JSON.parse(fs.readFileSync('namnapi.json', 'utf8'));

var result = [];
namnapiNames.names.forEach(function(element) {
   result.push(element.firstname);
});
console.log(JSON.stringify(result));
