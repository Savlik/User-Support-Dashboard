var express = require('express');
var http = require('http');
var request = require('request');
var Intercom = require('intercom-client');
var fs = require('fs');

//get settings file
var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

var app = express();
app.set('view engine', 'ejs');
var client = new Intercom.Client(settings['Intercom_app_id'], settings['Intercom_API_key']);

app.get('/', function (req, res) {  //main page
  stackoverflow_tags = req.query["stackoverflow_tags"];
  if(!stackoverflow_tags){ stackoverflow_tags = "apiblueprint";}
  fetch_posts(res, stackoverflow_tags);
})


//get posts from all sources, calls fetch_posts_cb when done
fetch_posts = function(res, stackoverflow_tags){
  stackoverflow = false;
  intercom = false;
  posts = Array();

  //get stackoverflow posts
  request(
    {
      method: 'GET',
      uri: "https://api.stackexchange.com/2.2/questions?order=desc&sort=creation&tagged="+stackoverflow_tags+"&site=stackoverflow",
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
        if(stackoverflow && intercom) fetch_posts_cb(res, posts, stackoverflow_tags);
    } else {
        stackoverflow = true;
        if(stackoverflow && intercom) fetch_posts_cb(res, posts, stackoverflow_tags);
    }
  });

  //get Intercom posts
  client.conversations.list({ type: 'team', team_id: settings['Intercom_team_id'] }, function(response){
    if(response.statusCode == 200){

      items = response["body"]["conversations"];
      items = items.filter(filter_intercom);

      for(i=0; i<items.length; i++){
        items[i]["source"] = "intercom";
        if(!items[i]["conversation_message"]["subject"]) items[i]["conversation_message"]["subject"] = "No subject";
        items[i]["id"] = "i" + items[i]["id"];
        items[i]["creation_date"] = items[i]["created_at"];
      }

      posts = posts.concat(items);
    }

    intercom = true;
    if(stackoverflow && intercom) fetch_posts_cb(res, posts, stackoverflow_tags);
  });

}

//call when fetch_posts is done
fetch_posts_cb = function(res, posts, stackoverflow_tags){
  //sort by date
  posts.sort( function(a,b) {
    return (a.creation_date > b.creation_date) ? -1 : ((b.creation_date > a.creation_date) ? 1 : 0);
  });

  //send result
  res.render('pages/index.ejs', {
    content: render_posts(posts),
    stackoverflow_tags: stackoverflow_tags
  });
  //res.send(render_posts(posts));
}

//filtering function for stackoverflow post
filter_stackoverflow = function(o){
  return !o.is_answered;
}

//filtering function for intercom posts
filter_intercom = function(o){
  if(!"conversation_parts" in o) return false;
  return true;
}

//returns html of all posts
render_posts = function(posts){
  html = "";
  for(i=0; i<posts.length; i++){
    html += render_post(posts[i]);
  }
  return html;
}

//returns html of a post
render_post = function(post){
  if(post.source=="stackoverflow"){
    return "<div id='" + post.id + "' class='post'>" +
      "<div class='source'><img src='/img/" + post.source + ".png' /></div>" +
      "<div class='time'>" + timeToString(post.creation_date) + "</div>" +
      "<div class='title'><a href='" + post.link+"'>" + post.title + "</a></div>" +
      "<div class>" +
    "</div>";
  }else if(post.source=="intercom"){
    return "<div id='" + post.id + "' class='post'>" +
      "<div class='source'><img src='/img/" + post.source + ".png' /></div>" +
      "<div class='time'>" + timeToString(post.creation_date) + "</div>" +
      "<div class='title'>" + post.conversation_message.subject + "</div>" +
      "<div class>" +
    "</div>";
  }
}

timeToString = function(timestamp){
  date = new Date(timestamp * 1000);
  y = date.getFullYear();
  m = date.getMonth() + 1;
  d = date.getDate() + 1;
  hh = date.getHours();
  mm = date.getMinutes();
  if (y < 10) {y = "0" + y;}
  if (m < 10) {m = "0" + m;}
  if (d < 10) {d = "0" + d;}
  if (hh < 10) {hh = "0" + hh;}
  if (mm < 10) {mm = "0" + mm;}

  return y + "/" + m + "/" + d + "<br />" + hh + ":" + mm;
}


app.use(express.static('public'));

var server = app.listen(settings["port"], function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Server is listening at http://%s:%s", host, port)
})