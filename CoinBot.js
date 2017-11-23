var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
const bittrex = require('node-bittrex-api');
const APIKEY = 'BITTREX-API-KEY-HERE';
const APISEC = 'BITTREX-API-SECRET-HEREY';
  bittrex.options({
  'apikey' : APIKEY,
  'apisecret' : APISEC,
  'verbose' : true,
  'cleartext' : false
  });

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
      var args = message.substring(1).split(' ');
      var cmd = args[0];
      var coin1 = args[1];
      var coin2 = args[2];
      var amt = args[3];
      args = args.splice(1);
      switch(cmd) {
        case 'price':
          console.log(coin1);
          console.log(coin2);
          var coinPrice = getPrice(coin1, coin2, channelID);
        break;

        case 'btc':
        bittrex.sendCustomRequest( 'https://bittrex.com/api/v2.0/pub/currencies/GetBTCPrice', function( data, err) {
          if (err) {
            err = "NETWORK ERROR"
            return onErr(err, channelID);
          }
          var btcprice = '```1 BTC = $' + data.result.bpi.USD.rate + '```';
          bot.sendMessage({
            to: channelID,
            message: btcprice
          });
        });
        break;

        case 'calc':
        coin1 = coin1.toUpperCase();
        coin2 = coin2.toUpperCase();
        amt = amt.toUpperCase();
        if (coin2 == 'USD') { coin2 = 'USDT'; }
        if (coin1 == 'SHITCASH') { coin1 = 'OK'; }
        if (coin1 == 'SHIT') { coin1 = 'OK'; }
        if (coin1 == 'SHITCOIN') { coin1 = 'OK'; }
        var market = coin2 + "-" + coin1;
        bittrex.getticker( { market : market }, function( data, err ) {
          if (err) { err = err.message; return onErr(err,channelID); }
          data = data.result.Ask;
          var conv = amt * data;
          if (coin2 == 'USDT') { var msg = '```fix' + "\n" + amt + ' ' + coin1 + ' = $' + conv + "\n" + '```'; }
        else { var msg = '```fix' + "\n" + amt + ' ' + coin1 + ' = ' + conv + ' ' + coin2 + "\n" + '```'; }
        bot.sendMessage({
          to: channelID,
          message: msg
        });
          });
        break;
     }
   } else if (message.substring(0, 1) == '$' && channelID == '285895131624898561') {
      var args = message.substring(1).split(' ');
      var cmd = args[0];
      var arg1 = args[1];
      var arg2 = args[2];
      args = args.splice(1);
      console.log(channelID);
      console.log(arg1);
      console.log(arg2);
      console.log(cmd);
      switch(cmd) {
        case 'config':
          console.log("CONF");
          var conf = getProp(arg1, arg2);
        break;

        case 'change':
          var change = mkChange(arg1, arg2);
        break;

        case 'buys':
          var buys = shBuys(arg1, arg2);
        break;

        case 'sells':
          var sells = shSells(arg1, arg2);
        break; 

        default:
          var usage = '```fix' + "\n" + 'USAGE: ${config, change, buys, sells,} {arg1, arg2}' + "\n" + '```'
          bot.sendMessage({
            to:channelID,
            message: usage
          });
        break;

      }
   }
});

function getPrice(coin1, coin2, channelID){
  coin1 = coin1.toUpperCase();
  coin2 = coin2.toUpperCase();
  var market = coin1 + "-" + coin2;
  bittrex.getticker( { market : market }, function( data, err ) {
    if (err) {
      err = err.message 
      return onErr(err, channelID); 
    }
    var coinPrice = '```1 ' + coin2 + ' = ' + data.result.Ask + ' ' + coin1 + '```';
    bot.sendMessage({
      to: channelID,
      message: coinPrice
    });
  });
}

function getProp(arg1, arg2){
  var channelID = '285895131624898561'
  if (!arg1) {
    bot.sendMessage({
      to: channelID,
      message: "Need conf file. Options are: app, conf, pairs, ind, dca" 
    });
  } else {
    switch(arg1) {
      case 'app':
        fs.readFile('/home/nick/proxybot/ProfitTrailer/application.properties', 'utf8', function( err, data ) {
          if (err) { return onErr(err, channelID); }
          var sendApp = '```fix' + "\n" + data + "\n" + '```';
          bot.sendMessage({
            to: channelID,
            message: sendApp
          });
        });
      break;

      case 'conf':
        fs.readFile('/home/nick/proxybot/ProfitTrailer/configuration.properties', 'utf8', function( err, data ) {
          if (err) { return onErr(err, channelID); }
          var sendConf = '```fix' + "\n" + data + "\n" + '```'; 
          bot.sendMessage({
            to: channelID,
            message: sendConf
          });
        });
      break;

      case 'pairs':
        console.log("PAIRS")
        fs.readFile('/home/nick/proxybot/ProfitTrailer/trading/PAIRS.properties', 'utf8', function( err, data ) {
          if (err) { return onErr(err, channelID); }
          var message = '```fix' + "\n" + data + "\n" + '```';
          return sendMsg(message, channelID);
          //console.log(sendPairs); 
          /*bot.sendMessage({
            to: channelID,
            message: sendPairs
          });*/
        });
      break;

      case 'ind':
        fs.readFile('/home/nick/proxybot/ProfitTrailer/trading/INDICATORS.properties', 'utf8', function( err, data ) {
          if (err) { return onErr(err, channelID); }
          var sendInd = '```fix' + "\n" + data + "\n" + '```'; 
          bot.sendMessage({
            to: channelID,
            message: sendInd
          });
        });
      break;

      case 'dca':
        fs.readFile('/home/nick/proxybot/ProfitTrailer/trading/DCA.properties', 'utf8', function( err, data ) {
          if (err) { console.log("ERROR"); return onErr(err, channelID); }
          var sendDca = '```fix' + "\n" + data + "\n" + '```'; 
          bot.sendMessage({
            to: channelID,
            message: sendDca
          });
        });
      break;
    }
  }

  }

  function sendMsg(message, channelID){
    
    bot.sendMessage(message, channelID)({
      to: channelID,
      message: message
    });
  }


function onErr(err, channelID){
  console.log(err);
  /*return 1;*/
  bot.sendMessage({
      to: channelID,
      message: err
    });
}
