const fs = require('fs');
const cursorsjs = require("cursors-js");
const colors = require('colors');
const request = require('request');
const logo = require('asciiart-logo');
const packagejson = require('./package.json');

const SocksProxyAgent = require('socks-proxy-agent');
const WebSocket = require("ws")
let ver = packagejson.version

let stdin = process.openStdin()
let bots = [];
let stop = false; //should stop connecting bots?
let ownProxies = !true;
let clickingAllButtons = false;
let clientLevel = -1
let deployed = [];
let server = {
  ws: "ws://157.245.226.69:2828",
  origin: "http://cursors.io"
}
let wss = new WebSocket.Server({
  port: 8080
});
let proxies;

Array.prototype.shuffle = function() {
  var i = this.length;
  while (i) {
    var j = Math.floor(Math.random() * i);
    var t = this[--i];
    this[i] = this[j];
    this[j] = t;
  }
  return this;
}
request('https://raw.githubusercontent.com/mathmakgakpak/mbots-for-cursors.io/master/botupdates.json', (err, req, body) => {
  if (err) {
    console.warn(err)
  }
  body = body.replace(/\r/g, '');
  var json = JSON.parse(body)
  let version = json.version;
  let changelogOfUpdate = json.message;

  var versionOnServerSplit = version.split(".");
  versionOnServerSplit = versionOnServerSplit.map(function(x) {
    return parseInt(x);
  })

  var versionOfBot = ver.split(".");
  versionOfBot = versionOfBot.map(function(x) {
    return parseInt(x);
  })
  var old = false;

  for (var i = 0; i < versionOnServerSplit.length; i++) {
    var server = versionOnServerSplit[i];
    var bot = versionOfBot[i];
    if (bot) {
      if (bot < server) {
        old = true
        break
      }
    } else {
      old = true
    }
  }

  var versionString = old ?  `Outdated version ${ver} new version ${version}` : `Version is current ${ver}`
  console.log(logo({
      name: packagejson.name,
      font: 'Banner3-D',
      lineChars: 10,
      padding: 2,
      margin: 3,
      borderColor: 'cyan',
      logoColor: 'blue',
      textColor: 'yellow',
    })
    .right(versionString)
    .emptyLine()
    .left("Github:")
    .center("github.com/mathmakgakpak/mbots-for-cursors.io")
    .emptyLine()
    .center("Created by mathias377#3326")
    .center("With help of 8y8x#1337 (vnx)")
    .emptyLine()
    .left("Changelog:")
    .center(changelogOfUpdate)
    .render());
})


if (ownProxies == true) {
  proxies = fs.readFileSync("proxy.txt").toString().split("\n");
} else {
  request('https://www.proxy-list.download/api/v1/get?type=socks5', (err, req, body) => {
    proxies = body.replace(/\r/g, '').split("\n");
  })
}





process.on('uncaughtException', function(err) { //some errors still exists
  //console.log('Caught exception: ', err);
});

//This code fully belongs to mathias377.
//You can edit it but you cannot publish the edited version.

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startBots(count = 50, botperProxy = 1, timeout = 10) {
  if (bots.length > 0) {
    console.log("You can't start bots again.")
    return;
  }
  stop = false;

  for (var i = 0; i < count && bots.length < proxies.length * botperProxy; i++) {
    if (stop) break;
    var proxyNumber = Math.floor(i / botperProxy);
    var bot = new cursorsjs.Client({
      ws: server.ws,
      origin: server.origin,
      agent: proxies[proxyNumber] ? new SocksProxyAgent("socks://" + proxies[proxyNumber]) : undefined,
      memorySaver: true
    })
    bot.botid = i;

    bot.on("close", function() {
      console.log("Disconnected: " + this.botid)
      bots.splice(bots.findIndex(z => z.id === this.id), 1)
    })

    bot.ws.on("error", function() {
      bots.splice(bots.findIndex(z => z.id === this.id), 1)
    })

    bot.on("open", function() {
      bots.push(this)
      this.move(300, 175)
      console.log("Connected " + this.botid)
    })

    await sleep(timeout)
  }
}

function stopBots() {
  stop = true;
  bots.forEach(function(bot) {
    bot.ws.close()
  })
  bots = []
}





setInterval(function() { //deployed bots clicking
  for (let i = 0; i < deployed.length; i++) {
    var bot = bots.find(function(bot) {
      return bot.id === deployed[i]
    })
    if (bot) {
      bot.click(); //what if level will restart :eyes:
    } else {
      deployed.splice(i, 1) //its ded so bye
    }
  };

}, 100)
setInterval(function() {
  if (clickingAllButtons) clickAllButtons();
}, 300)



function deploy(x, y) {
  for (let i = 0; i < bots.length; i++) {
    var bot = bots[i];
    if (!deployed.includes(bot.id) && bot.level === clientLevel) {
      deployed.push(bot.id)
      bot.move(x, y);
      break;
    }
  }
}

function undeploy(x, y) {
  for (var i = 0; i < deployed.length; i++) {
    var bot = bots.find(function(bot) {
      return bot.id === deployed[i] && bot.level === clientLevel
    })
    if (bot) {
      bot.move(x, y);
      deployed.splice(i, 1)
      break;
    } else {
      deployed.splice(i, 1) //its ded so bye
    }
  }
}

function click(x, y) { //idk why i did 2 seperated funcs
  bots.forEach(async function(bot) {
    if (!deployed.includes(bot.id)) {
      await bot.move(x, y)
      bot.click()
    }
  })
}

function move(x, y) {
  bots.forEach(async function(bot) {
    if (!deployed.includes(bot.id)) {
      await bot.move(x, y);
      bot.click();
    }
  })
}

function draw(x1, y1, x2, y2) {
  bots.forEach(function(bot) {
    if (!deployed.includes(bot.id)) bot.draw(x1, y1, x2, y2)
  })
}

function findAllObjectsOfType(type, bot) {
  var objects = []
  for (var i = 0; i < bot.levelObjects.length; i++) {
    var obj = bot.levelObjects[i];
    if (obj.type === type) objects.push(obj);
  }
  return objects;
}

async function clickAllButtons() {
  var allBotsInLevel = [];
  for (var i = 0; i < bots.length; i++) {
    if (bots[i].level === clientLevel) allBotsInLevel.push(bots[i]);
  }
  if (!allBotsInLevel.length) return;

  var buttons = findAllObjectsOfType(4, allBotsInLevel[0]);
  console.log(buttons)
  if (!buttons.length) return;

  if (allBotsInLevel.length < buttons.length) buttons.shuffle(); //weirdo way to fix that if bots will be lower count than buttons OUF

  var smth = Math.floor(allBotsInLevel.length / buttons.length);

  for (var i = 0; i < allBotsInLevel.length; i++) {
    var bot = allBotsInLevel[i];

    if (!deployed.includes(bot.id)) {
      var button = buttons[Math.floor(i / smth)];
      if (button) {
        await bot.move(button.x + button.h / 2, button.y + button.w / 2)
        bot.click()
      }
    }
  }
}

//controller
wss.on('connection', function(ws) {
  var sendingInterval = setInterval(function() {
    ws.send(JSON.stringify({
      botsCount: bots.length
    }))
  }, 1000)
  ws.on("close", function() {
    clearInterval(sendingInterval);
  })
  ws.on('message', function(msg) {

    let control = JSON.parse(msg)
    switch (control.eval) {
      case "move":
        if (control.x == undefined || control.y == undefined) return;
        move(control.x, control.y)
        break;
      case "click":
        if (control.x == undefined || control.y == undefined) return;
        click(control.x, control.y)
        break;
      case "draw":
        if (control.x1 == undefined || control.y1 == undefined || control.x2 == undefined || control.y2 == undefined) return;
        draw(control.x1, control.y1, control.x2, control.y2)
        break;
      case "deploy":
        deploy(control.x, control.y) //position where bot should go and start clicking
        break;
      case "undeploy":
        undeploy();
        break;
      case "clickingAllButtons":
        clickingAllButtons = !clickingAllButtons;
        break;
      case "levelUpdate":
        clientLevel = control.level
        break
      case "connect":
        server = {
          ws: control.ws,
          origin: control.origin
        }
        startBots(control.count, control.botsPerProxy, control.timeout);
        break;
      case "stop":
        stopBots()
        break;
    }
  })
})

stdin.on("data", function(d) {
  let msg = d.toString().trim();
  try {
    return console.log(JSON.stringify(eval(msg), undefined, 2))
  } catch (e) {
    console.log('[ERROR]:' + e.name + ":" + e.message + "\n" + e.stack)
  }

})
