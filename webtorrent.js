function get_magnetlink(magnet_link){
  var regex = /(magnet:\?xt=urn:btih:[a-z0-9]{20,50})/g
  var match = regex.exec(magnet_link)
  if (match){
    console.log(match[1]);
    download_torrent(match[1]);
  }
}

function download_torrent(magnet_link){
  var client = new WebTorrent()

  var torrentId = magnet_link+"&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent"

  client.add(torrentId, function (torrent) {
    // Torrents can contain many files. Let's use the .mp4 file
    var file = torrent.files.find(function (file) {
      return file.name.endsWith('.mp4')
    })

    // Display the file by adding it to the DOM.
    // Supports video, audio, image files, and more!
    file.appendTo('body')
  })
}


function bitdb_get_magnetlinks(limit) {
  console.log(limit);
  var query = {
    request: {
      encoding: { b1: "hex" },
      find: {
        b1: { "$in": ["6d02"] }
      },
      project: {
        b0:1 ,b1: 1, b2: 1, tx: 1, block_index: 1, _id: 0
      },
      limit: limit
    },
    response: {
      encoding: {
        b1: "hex",
        b2: "utf8"
      }
    }
  };
  var b64 = btoa(JSON.stringify(query));
  var url = "https://bitdb.network/v2/q/" + b64;

  var header = {
    headers: { key: "qz6qzfpttw44eqzqz8t2k26qxswhff79ng40pp2m44" }
  };

  fetch(url, header).then(function(r) {
    return r.json()
  }).then(function(r) {

    document.getElementById('bitdb_output').innerHTML = ""

    var li = document.createElement('li');
    li.innerHTML = "CONFIRMED:"
    document.getElementById('bitdb_output').appendChild(li);

    for(i in r['confirmed']){
      var tx = r['confirmed'][i]
      var li = document.createElement('li');
      li.innerHTML = JSON.stringify(tx);
      console.log(tx.b2);
      // get_magnetlink(tx.b2);
      document.getElementById('bitdb_output').appendChild(li);
    };

    var li = document.createElement('li');
    li.innerHTML = "UNCONFIRMED:"
    document.getElementById('bitdb_output').appendChild(li);

    for(i in r['unconfirmed']){
      var tx = r['unconfirmed'][i]
      var li = document.createElement('li');
      li.innerHTML = JSON.stringify(tx);
      console.log(tx.b2);
      get_magnetlink(tx.b2);
      document.getElementById('bitdb_output').appendChild(li);
    };
  })
};
