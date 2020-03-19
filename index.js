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
process.on('uncaughtException', function(err) {
  //console.log('Caught exception: ', err);
});

//This code fully belongs to mathias377.
//You can edit it but you cannot publish the edited version.
stdin.on("data", function(d) {
  let msg = d.toString().trim();
  try {
    return console.log(JSON.stringify(eval(msg), undefined, 2))
  } catch (e) {
    console.log('[ERROR]:' + e.name + ":" + e.message + "\n" + e.stack)
  }

})

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

request('https://raw.githubusercontent.com/mathmakgakpak/mbots-for-cursors.io/master/botupdates.json', (err, req, body) => {
  if (err) {
    console.warn(err)
  }
  body = body.replace(/\r/g, '');
  let version = JSON.parse(body).version;
  let messageOfUpdate = JSON.parse(body).message;
  let priority = JSON.parse(body).priority;

  if (version == ver) {
    console.log(`Your version is actual ${version}`.green)
  } else {
    if (priority == 0) {
      console.log(`Update your bot version. Your version is ${ver} you should update it to ${version}`.green)
      console.log(`Update messages: ${messageOfUpdate}`)
    } else if (priority == 1) {
      console.log(`Update your bot version. Your version is ${ver} you must update it to ${version}`.red)
      console.log(`Update messages: ${messageOfUpdate}`)
    }

  }
})

let ownProxies = true

let proxies;
if (ownProxies == true) {
  proxies = fs.readFileSync("proxy.txt").toString();
  proxies = proxies.split("\n")
} else {
  request('https://www.proxy-list.download/api/v1/get?type=socks5', (err, req, body) => {
    proxies = body.replace(/\r/g, '');
    proxies = proxies.split("\n")
  })
}
let botx;
let boty;

console.log(logo(packagejson).render());
console.log("------------------------------------------------".blue);
console.log(`To start bots type (without quotes) "startBots(count, botsPerProxy, timeout)" type "stopBots()"`)
console.log("------------------------------------------------".blue);

async function startBots(count = 50, botperProxy = 1, timeout = 10) {
  if (bots.length > 0) {
    console.log("You can't start bots again.")
    return;
  }

  for (var i = 0; i < count && bots.length < proxies.length * botperProxy; i++) {
    var proxyNumber = Math.floor(i / botperProxy);
    var bot = new cursorsjs.cjs({
      agent: proxies[proxyNumber] ? new SocksProxyAgent("socks://" + proxies[proxyNumber]) : undefined,
      memorySaver: true
    })
    bot.deployed = false
    bot.botid = i

    bot.on("close", function() {
      console.log("Disconnected: " + this.botid)
      bots.splice(bots.findIndex(z => z.id === this.id), 1)
    })

    bot.ws.on("error", function() {
      bots.splice(bots.findIndex(z => z.id === this.id), 1)
    })

    bot.on("open", function() {
      this.move(300, 175)
      console.log("Connected " + this.botid)
    })

    bots.push(bot)

    await sleep(timeout)
  }
}

function stopBots() {
  bots.forEach(function(bot) {
    bot.ws.close()
  })
  bots = []
  bots.sort()
}

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

setInterval(function() { //deployed bots clicking
  for (let i = 0; i < deployed.length; i++) {
    var bot = bots.find(function(bot) {
      return bot.id === deployed[i]
    })
    if (bot) {
      bot.click();
    } else {
      deployed.splice(i, 1) //its ded so bye
    }
  };

}, 100)
setInterval(function() {
  if (clickingAllButtons) clickAllButtons();
},300)
var deployed = [];

function deploy(x, y) {
  for (let i = 0; i < bots.length; i++) {
    var bot = bots[i];
    if (!deployed.includes(bot.id)) {
      deployed.push(bot.id)
      bot.move(x, y);
      break;
    }
  }
}

function undeploy(x, y) {
  for (var i = 0; i < deployed.length; i++) {
    var bot = bots.find(function(bot) {
      return bot.id === deployed[i]
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

function click(x, y) {
  bots.forEach(async function(bot) {
    if (!deployed.includes(bot.id)) {
      await bot.move(x, y)
      bot.click(x, y)
    }
  })
}

function move(x, y) {
  bots.forEach(function(bot) {
    if (!deployed.includes(bot.id)) bot.move(x, y)
  })
}

function draw(x1, y1, x2, y2) {
  bots.forEach(function(bot) {
    if (!deployed.includes(bot.id)) bot.draw(x1, y1, x2, y2)
  })
}

async function clickAllButtons() {
  var botsLevels = {};
  for (var i = 0; i < bots.length; i++) {
    var bot = bots[i];
    if (!botsLevels[bot.level]) botsLevels[bot.level] = [];
    botsLevels[bot.level].push(bot);
  }
  for (var level in botsLevels) {
    var Level = botsLevels[level];
    var mainBot = Level[0];
    var buttons = []
    for (var i = 0; i < mainBot.levelObjects.length; i++) {
      var obj = mainBot.levelObjects[i];
      if (obj.type === 4) {
        buttons.push(obj)
      }
    }
    if (!buttons.length) continue;
    if (bots.length / buttons.lengt < 1) buttons.shuffle(); //weirdo way to fix that if bots will be lower count than buttons OUF
    var smth = Math.floor(Level.length / buttons.length);
    for (var i = 0; i < Level.length; i++) {
      var bot = Level[i];
      if (!deployed.includes(bot.id)) { //i prefer checking it there cuz it can bug if it would be in pushing bot ^
        var button = buttons[Math.floor(i / smth)]
        if (button) {
          await bot.move(button.x + button.h / 2, button.y + button.w / 2);
          bot.click();
        }
      }
    }
  }
}
var clickingAllButtons = false;

//controler
let wss = new WebSocket.Server({
  port: 8080
});

wss.on('connection', function(ws) {
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
        undeploy(control.x, control.y); //where bot should back
        break;
      case "clickingAllButtons":
        clickingAllButtons = !clickingAllButtons;
        break;
    }
  })
})
