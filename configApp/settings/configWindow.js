const fs = require("fs")
const path = require("path")
const Registry = require('rage-edit').Registry

let oldTitle

let configs = updateConfigs()

setInterval(
    anime({
        targets: '#wrap-round-animation img',
        rotate: 360,
        keyframes: [
            { borderRadius: "100%" },
            { borderRadius: 0 }
        ],
        easing: 'easeInOutQuad'
    }).restart, 2000)

setInterval(anime({
    targets: '#wrap-fade-animation img',
    opacity: 1,
    easing: 'easeInOutQuad'
}).restart, 2000)

function updateRessources() {
    $.ajax({
        request: "GET",
        url: 'http://localhost:1764/token',
        success: function (responded) {
            let token = responded
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
                    if (responded) {
                        title = (responded.item.name);
                        let image = (responded.item.album.images[a].url);
                        let artist = (responded.item.artists[i].name);
                        if (title != oldTitle) {
                            oldTitle = title

                            $(".image").attr("src", image);
                            $(".artist").text(artist);
                            $(".title").text(title);
                            let artlen = artist.length;
                            if (artlen > 20) {
                                $(".artist").replaceWith($('<marquee class="artist">' + artist + '</marquee>'));
                            } else {
                                $(".artist").replaceWith($('<p class="artist">' + artist + '</p>'));
                            }
                            let titlen = title.length;
                            if (titlen > 20) {
                                $(".title").replaceWith($('<marquee class="title">' + title + '</marquee>'));
                            } else {
                                $(".title").replaceWith($('<p class="title">' + title + '</p>'));
                            }
                        }
                    }
                    $.ajax({
                        request: "GET",
                        url: "https://api.spotify.com/v1/me",
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        success: function (responded) {
                            let username = responded.display_name
                            let userimg = responded.images[0].url
                            $("#accountIMG").attr("src", userimg)
                            $("#name").text(`${username}`)
                        }
                    })
                }
            })
        }
    })
}

function updateConfigs() {

    try {
        let data = fs.readFileSync(path.join(process.env.APPDATA,"spotifypluginobs", "configs.json"))
        data = JSON.parse(data)
        return data
    } catch (error) { return {} }
}
setInterval(updateRessources, 1000)
updateRessources()

//Account page
document.getElementById("btn-account").addEventListener("click", () => {
    require("electron").shell.openExternal("https://www.spotify.com/redirect/account-page")
})

document.getElementById("btn-disconnect").addEventListener("click", () => {
    ipc.sendSync("disconnect")
    require('electron').remote.getCurrentWindow().close()
})

//Animation page
$(`#${configs.animation}`).addClass("border-success")
$(document).ready(
    function () {
        $(".wrap").click(
            function (event) {
                $(this).addClass("border-success").siblings().removeClass("border-success");
                configs.animation = $(this)[0].id
                writeConfigs()
            }
        )
    })

//Startup page
const autoStartupButton = document.getElementById("auto-startup-button")
autoStartupButton.checked = configs.autoStartup

autoStartupButton.addEventListener("click",()=>{
    configs.autoStartup = autoStartupButton.checked
    if(configs.autoStartup === true){
            Registry.set("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "SpotifyPluginObs", path.join(__dirname, "..", "..", "..", "Spotify-Plugin-OBS.exe"))
        } else {
            Registry.delete("HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "SpotifyPluginObs")
        }
    writeConfigs()
})
const smallStartupButton = document.getElementById("small-startup-button")
smallStartupButton.checked = configs.smallStartup
smallStartupButton.addEventListener("click",()=>{
    configs.smallStartup = smallStartupButton.checked
    writeConfigs()
})

function writeConfigs(){
    fs.writeFileSync(path.join(process.env.APPDATA,"spotifypluginobs", "configs.json"), JSON.stringify(configs), () => { if (err) console.log(error) })
}