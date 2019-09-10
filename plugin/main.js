var tilte;
var oldTitle
//open plugin/config.json
setInterval(function start() {
  var jsondata = JSON.parse(data);
  var token = jsondata.refresh_token;
  var path = jsondata.url;
getSpotifyJson(token);
}, 1 * 1000);

//send request to the Spotify API
//get the responded Json
function getSpotifyJson(token){
    $.ajax({
      request: "GET",
      url : 'https://api.spotify.com/v1/me/player/currently-playing?market=ES',
      headers: {
          'Authorization': 'Bearer '+token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      success: function(responded) {
        var i = "0";
        if(title == oldTitle)
        title = (responded.item.name);
        var image = (responded.item.album.images[i].url);
        var artist = (responded.item.artists[i].name);
        //add featuring artist later?
        title = oldTitle;
        displayPlayedMusic(title,image,artist);
      }
  });
}


//display name, artist and image on the htlm page
function displayPlayedMusic(title,image,artist){
  $("#artist").text(artist);
  $("#title").text(title);
  $("#image").attr("src", image);
  
}


//make the text slidig right to left ( called if chain > 15 carac)
function slindingText(){
}

//dir for the HTML display 
//       C:\Users\charl\Documents\Spotify-Plugin-OBS\plugin\index.html
// GET https://api.spotify.com/v1/me/player/currently-playing