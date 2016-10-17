var express = require('express');
var http = require('http');
var request = require("request");
var Intercom = require('intercom-client');

var client = new Intercom.Client({ token: 'my_token' });

var app = express();

app.get('/', function (req, res) {  //main page
  fetch_posts(res);
})

var flags = Array();
var posts = Array();



fetch_posts = function(res){
  stackoverflow = false;
  intercom = false;
  posts = Array();

  request(  //get stackoverflow posts
    {
      method: 'GET',
      uri: "https://api.stackexchange.com/2.2/questions?order=desc&sort=creation&tagged=apiblueprint&site=stackoverflow",
      gzip: true
    }, function (error, response, body) {
    if (!error) {
        items = JSON.parse(body)['items'];
        for(i=0; i<items.length; i++){
          items[i]["source"] = "stackoverflow";
          items[i]["id"] = "so"+items[i].question_id;
        }
        posts = posts.concat(items);
        stackoverflow = true;
        if(stackoverflow && intercom) fetch_posts_cb(res);
    } else {
        stackoverflow = true;
        if(stackoverflow && intercom) fetch_posts_cb(res);
    }
  });

  client.conversations.list({ type: 'admin', admin_id: 21599 }, function(response){
    if(response.ok){
      items = response["body"]["conversations"];
      for(i=0; i<items.length; i++){
        items[i]["source"] = "intercom";
        items[i]["id"] = "i"+items[i].id;

        items[i]["creation_date"] = items[i]["created_at"];
        items[i]["title"] = items[i]["conversation_message"]["subject"];
        items[i]["link"] = "#todo";
      }
      posts = posts.concat(items);
    }
    intercom = true;
    if(stackoverflow && intercom) fetch_posts_cb(res);
  });

}

fetch_posts_cb = function(res){  //call when fetch_posts is done
  res.send(render_posts());
}

render_posts = function(){
  html = "";
  for(i=0; i<posts.length; i++){
    html +=
    "<div id='" + items[i].id + "' class='post'>" +
      "<div class='source'><img src='/img/" + items[i].source + ".png' /></div>" +
      "<div class='title'><a href='" + posts[i].link+"'>" + posts[i].title + "</a></div>" +
      "<div class='time'>" + posts[i].creation_date+"</div>" +
      "<div class>" +
    "</div>";
  }
  return html;
}

app.use(express.static('public'));

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})