const exec = require("child_process").exec
const unzipper = require("unzipper")
const request = require("request")
const wget = require("node-wget")
const path = require("path")
const fs = require("fs")
const version = "v1.2.3"

request("https://api.github.com/repos/DrakLulu/Spotify-Plugin-OBS/releases/latest", {
    headers: {
        "User-Agent": "Spotify-Plugin-OBS"
    }
}, (error, response, body) => {
    body = JSON.parse(body)
    releaseVersion = body.tag_name.slice(1)

    if (version !== releaseVersion) {
        console.log("found update...")

        for (let i = 0; i < body.assets.length; i++) {
            const asset = body.assets[i];
            if (asset.name === "Spotify-Plugin-OBS-win32-x64.zip") {
                console.log("downloading....")
                wget(asset.browser_download_url, () => {
                    console.log("decompressing...")
                    process.stdin.setRawMode(true);
                    process.stdin.resume();
                    process.stdin.on('data', process.exit.bind(process, 0));
                    a = true
                    fs.createReadStream('Spotify-Plugin-OBS-win32-x64.zip')
                        .pipe(unzipper.Parse())
                        .on('entry', function (entry) {
                            const fileName = entry.path;
                            const type = entry.type; // 'Directory' or 'File'
                            const size = entry.vars.uncompressedSize; // There is also compressedSize;
                            if (type === "File") {
                                if (fileName.startsWith("Spotify-Plugin-OBS-win32-x64/resources/app/")) {
                                    let filePath = fileName.split("/")
                                    let folderPath = ""
                                    for (let index = 0; index < filePath.length - 1; index++) {
                                        folderPath = folderPath + filePath[index] + "/"
                                    }
                                    fs.mkdirSync("out/" + folderPath.toString(), { recursive: true })
                                    entry.pipe(fs.createWriteStream("out/" + fileName));
                                } else {
                                    entry.autodrain();
                                }
                            }
                            // a fix 2 arrive avant 1
                            console.log("1")

                        });
                })
                console.log("2")
                exec(`xcopy ${path.join(__dirname, "out")}\\*  ${path.join(__dirname, "tt")} /E`, (err, stdout, stderr) => {
                    console.log(stderr)
                    console.log(stdout)

                }).stdout.on('data', function (data) {
                    console.log(data.toString());
                });
            }
        }

    } else {
        createWindow()
    }
})
