var express = require('express');
var http = require('http');
var request = require('request');
var Intercom = require('intercom-client');

var app = express();
var client = new Intercom.Client({ token: 'TODO: my_token' });
var intercom_admin_id = 'TODO: admin_id';

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
        items = items.filter(filter_stackoverflow);

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

  client.conversations.list({ type: 'admin', admin_id: intercom_admin_id }, function(response){
    if(response.ok){

      items = response["body"]["conversations"];
      items = items.filter(intercom);

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

filter_stackoverflow = function(o){
  return !o.is_answered;
}

filter_intercom = function(o){
  return o.conversation_parts.conversation_parts.length == 0;
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
   console.log("Server is listening at http://%s:%s", host, port)
})