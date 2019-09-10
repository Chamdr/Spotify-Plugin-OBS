let tilte;
let oldTitle
//open plugin/config.json
setInterval(() => {
  let jsondata = JSON.parse(data);
  let token = jsondata.refresh_token;
  let path = jsondata.url;
  getSpotifyJson(token);
}, 1 * 1000);



//send request to the Spotify API
//get the responded Json
function getSpotifyJson(token) {
  $.ajax({
    request: "GET",
    url: 'https://api.spotify.com/v1/me/player/currently-playing',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    success: function (responded) {
      let i = "0";
      let a = "2";
      title = (responded.item.name);
      if (title != oldTitle) {
        let image = (responded.item.album.images[a].url);
        let artist = (responded.item.artists[i].name);
        //add featuring artist later?
        oldTitle = title;
        displayPlayedMusic(title, image, artist);
      }
    }
  });
}

//display name, artist and image on the htlm page
function displayPlayedMusic(title, image, artist) {
  $("#artist").text(artist);
  $("#title").text(title);
  $("#image").attr("src", image);
  let artlen = $("#artist").text().length;
  if (artlen > 17) {
    $("#artist").replaceWith($('<marquee id="artist">' + artist + '</marquee>'));
  } else {
    $("#artist").replaceWith($('<p id="artist">' + artist + '</p>'));
  }
  let titlen = $("#title").text().length;
  if (titlen > 17) {
    $("#title").replaceWith($('<marquee id="title">' + title + '</marquee>'));
  } else {
    $("#title").replaceWith($('<p id="title">' + title + '</p>'));
  }
}