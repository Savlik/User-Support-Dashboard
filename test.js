var express = require('express');
var http = require('http');
var request = require("request");

var app = express();

app.get('/', function (req, res) {  //main page
  fetch_posts(res);
})

var flags = Array();
var posts = Array();

fetch_posts = function(res){
  stackoverflow = false;
  intercom = true;
  posts = Array();

  request(  //get stackoverflow posts
    {
      method: 'GET',
      uri: "https://api.stackexchange.com/2.2/questions?order=desc&sort=creation&tagged=apiary&site=stackoverflow",
      gzip: true
    }, function (error, response, body) {
    if (!error) {
        items = JSON.parse(body)['items'];
        for(i=0; i<items.length; i++){
          items[i].source = "stackoverflow";
        }
        posts = posts.concat(items);
        stackoverflow = true;
        if(stackoverflow && intercom) fetch_posts_cb(res);
    } else {
        console.log(error);
    }
  });


}

fetch_posts_cb = function(res){  //call when fetch_posts is done
  res.send(render_posts());
}

render_posts = function(){
  html = "";
  for(i=0; i<posts.length; i++){
    html +=
    "<div id='"+items[i].source+posts[i].question_id+"' class='post'>"+
      "<div class='source'><img src='/img/"+items[i].source+".png' /></div>"+
      "<div class='title'><a href='"+posts[i].link+"'>"+posts[i].title+"</a></div>"+
      "<div class='time'>"+posts[i].creation_date+"</div>"+

      "<div class>"+
    "</div>";
  }
  //console.log(html);
  return html;
}

app.get('/process', function (req, res) {  //process tagging with flags
  id = req.query.id;
  flag = req.query.flag;
  value = req.query.value;

  if(value==1){ //turn flag on
    flags.push({id: id, flag: flag});
  }else{  //turn flag off
    for(i=0; i<flags.length; i++){
      if(flags[i]['id']==id && flags[i]['flag']==flag){
        flags.splice(i,1);
      }
    }
  }
  console.log(JSON.stringify(flags));
  res.end(JSON.stringify(flags));
})

app.use(express.static('public'));

var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port

   console.log("Example app listening at http://%s:%s", host, port)
})