var http = require('http');

var options = {
  host: 'www.thottbot.com',
  path: '/quest=123'
};

var callback = function(response) {
  var str = '';

  //another chunk of data has been recieved, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been recieved, so we just print it out here
  response.on('end', function () {
    var h3Description = '<h3>Description</h3>';
    var start = str.indexOf(h3Description) + h3Description.length;
    var end = str.indexOf('<h3>', start + 1);
    console.log(start);
    console.log(end);
    var text = str.substr(start, end - start).trim().replace(/<br \/>/g, '\n');
    console.log(text);
  });
};

http.request(options, callback).end();
