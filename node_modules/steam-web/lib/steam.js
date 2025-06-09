var http = require('http');
var qs = require('qs');

/*
url format for sample api request:
http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=440&count=3&maxlength=300&format=json */


/*constructor
accepts an object.

.apiKey     required      The steam web API key, obtained from: http://steamcommunity.com/dev/apikey
.format     optional      The format for the response [json, xml, vdf] - default: json
*/
var steam = function(obj) {
  var validFormats = ['json', 'xml', 'vdf'];

  //error checking
  if (typeof obj != 'object') throw new Error('invalid options passed to constructor');
  if (typeof obj.apiKey == 'undefined' || typeof obj.apiKey != 'string') throw new Error('invalid or missing API key');
  if (obj.format) {
    if (validFormats.indexOf(obj.format)>-1) {
      this.format = obj.format;
    }
    else {
      throw new Error('invalid format specified');
    }
  }

  //instance vars
  this.apiKey = obj.apiKey
}

 //defaults
steam.prototype.format = 'json';
steam.prototype.apiKey = '';


//API methods
steam.prototype.getNewsForApp = function(obj) {
  if (!this.validate(obj, 'getNewsForApp')) return false;
  obj.path = '/ISteamNews/GetNewsForApp/v0002/?';
  this.makeRequest(obj)
}
steam.prototype.getGlobalAchievementPercentagesForApp = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (!this.validate(obj, 'getGlobalAchievementPercentagesForApp')) return false;
  obj.path = '/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?';
  this.makeRequest(obj)
}
steam.prototype.getPlayerSummaries = function(obj) {
  if (!this.validate(obj, 'getPlayerSummaries')) return false;
  //turn the array into a comma separated list
  if (typeof obj.steamids == 'object') obj.steamids = obj.steamids.join('\,');
  obj.path = '/ISteamUser/GetPlayerSummaries/v0002/?',
  this.makeRequest(obj)
}
steam.prototype.getFriendList = function(obj) {
  if (!this.validate(obj, 'getFriendList')) return false;
  obj.path = '/ISteamUser/GetFriendList/v0001/?',
  this.makeRequest(obj)
}
steam.prototype.getOwnedGames = function(obj) {
    if (!this.validate(obj, 'getOwnedGames')) return false;
    obj.path = '/IPlayerService/GetOwnedGames/v0001/?';
    this.makeRequest(obj);
}
steam.prototype.getSchema = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (!this.validate(obj, 'getSchema')) return false;
  obj.path = '/IEconItems_'+obj.gameid+'/GetSchema/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getPlayerItems = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (!this.validate(obj, 'getPlayerItems')) return false;
  obj.path = '/IEconItems_'+obj.gameid+'/GetPlayerItems/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getAssetPrices = function(obj) {
  var obj = this.normalizeAppGameId(obj);
  if (!this.validate(obj, 'getAssetPrices')) return false;
  obj.path = '/ISteamEconomy/GetAssetPrices/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getAssetClassInfo = function(obj) {
  //normalize
  var obj = this.normalizeAppGameId(obj);
  if (!this.validate(obj, 'getAssetClassInfo')) return false;
  //convenience allowing to just pass an array of classIds
  if (obj.classIds && !obj.class_count) {
    var i = 0;
    obj.classIds.forEach(function(id){
      obj['classid'+i] = id;
      i++;
    });
    obj.class_count = obj.classIds.length;
  }
  obj.path = '/ISteamEconomy/GetAssetClassInfo/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getPlayerAchievements = function(obj) {
  var obj = this.normalizeAppGameId(obj);
  if (!this.validate(obj, 'getPlayerAchievements')) return false;
  obj.path = '/ISteamUserStats/GetPlayerAchievements/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getRecentlyPlayedGames = function(obj) {
   if (!this.validate(obj, 'getRecentlyPlayedGames')) return false;
  obj.path = '/IPlayerService/GetRecentlyPlayedGames/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getUserStatsForGame = function(obj) {
  if(!this.validate(obj, 'getUserStatsForGame')) return false;
  obj.path = '/ISteamUserStats/GetUserStatsForGame/v0002/?';
  this.makeRequest(obj);
}
steam.prototype.getGlobalStatsForGame = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (typeof obj.name == 'string') obj.name = [obj.name];
  if (!obj.count) obj.count = obj.name.length;
  if (!this.validate(obj, 'getGlobalStatsForGame')) return false;
  obj.path = '/ISteamUserStats/GetGlobalStatsForGame/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.isPlayingSharedGame = function(obj) {
  if (!this.validate(obj, 'isPlayingSharedGame')) return false;
  obj.path = '/IPlayerService/IsPlayingSharedGame/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getSchemaForGame = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (!this.validate(obj, 'getSchemaForGame')) return false;
  obj.path = '/ISteamUserStats/GetSchemaForGame/v2/?';
  this.makeRequest(obj);
}
steam.prototype.getPlayerBans = function(obj) {
  if (!this.validate(obj, 'getPlayerBans')) return false;
  if (typeof obj.steamids == 'object' && obj.steamids != null) obj.steamids = obj.steamids.join(',');
  obj.path = '/ISteamUser/GetPlayerBans/v1/?';
  this.makeRequest(obj);
}

// TeamFortress Wiki
// ISteamApps
steam.prototype.getAppList = function(obj) {
  obj.path = '/ISteamApps/GetAppList/v2/?';
  this.makeRequest(obj);
}
steam.prototype.getServersAtAddress = function(obj) {
  if (!this.validate(obj, 'getServersAtAddress')) return false;
  obj.path = '/ISteamApps/GetServersAtAddress/v1/?';
  this.makeRequest(obj);
}
steam.prototype.upToDateCheck = function(obj) {
  if (!this.validate(obj, 'upToDateCheck')) return false;
  obj.path = '/ISteamApps/UpToDateCheck/v1/?';
  this.makeRequest(obj);
}
// TODO: ISteamRemoteStorage
// ISteamUser
steam.prototype.getUserGroupList = function(obj) {
  if (!this.validate(obj, 'getUserGroupList')) return false;
  obj.path = '/ISteamUser/GetUserGroupList/v1/?';
  this.makeRequest(obj);
}
steam.prototype.resolveVanityURL = function(obj) {
  if (!this.validate(obj, 'resolveVanityURL')) return false;
  obj.path = '/ISteamUser/ResolveVanityURL/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getNumberOfCurrentPlayers = function(obj) {
  if (!this.validate(obj, 'getNumberOfCurrentPlayers')) return false;
  obj.path = '/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?';
  this.makeRequest(obj);
}
// IPlayerService
steam.prototype.getSteamLevel = function(obj) {
  if (!this.validate(obj, 'getSteamLevel')) return false;
  obj.path = '/IPlayerService/GetSteamLevel/v1/?';
  this.makeRequest(obj);
}
steam.prototype.getBadges = function(obj) {
  if (!this.validate(obj, 'getBadges')) return false;
  obj.path = '/IPlayerService/GetBadges/v1/?';
  this.makeRequest(obj);
}
steam.prototype.getCommunityBadgeProgress = function(obj) {
  if (!this.validate(obj, 'getCommunityBadgeProgress')) return false;
  obj.path = '/IPlayerService/GetCommunityBadgeProgress/v1/?';
  this.makeRequest(obj);
}
// SteamWebAPIUtil
steam.prototype.getServerInfo = function(obj) {
  obj.path = '/ISteamWebAPIUtil/GetServerInfo/v0001/?';
  this.makeRequest(obj);
}
steam.prototype.getSupportedAPIList = function(obj) {
  obj.path = '/ISteamWebAPIUtil/GetSupportedAPIList/v0001/?';
  this.makeRequest(obj);
}
// IEconItems_<ID>
steam.prototype.getSchemaURL = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (!this.validate(obj, 'getSchemaURL')) return false;
  obj.path = '/IEconItems_'+obj.gameid+'/GetSchemaURL/v1/?';
  this.makeRequest(obj);
}
steam.prototype.getStoreMetadata = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (!this.validate(obj, 'getStoreMetadata')) return false;
  obj.path = '/IEconItems_'+obj.gameid+'/GetStoreMetadata/v1/?';
  this.makeRequest(obj);
}
steam.prototype.getStoreStatus = function(input) {
  var obj = this.normalizeAppGameId(input);
  if (!this.validate(obj, 'getStoreStatus')) return false;
  obj.path = '/IEconItems_'+obj.gameid+'/GetStoreStatus/v1/?';
  this.makeRequest(obj);
}

//internal used to validate an object to send to an api request, could also be used
//by the user if they need to verify the validity of data submitted from an outside source
//the callback is passed two arguments, such:  callback(err, data)
steam.prototype.validate = function(obj, method) {
  var error;
  if (!obj) throw new Error('no arguments passed');
  //if the user doesn't pass a callback, it makes no sense
  if (typeof obj.callback != 'function') throw new Error('invalid callback');

  switch(method) {
    case 'getNewsForApp':
      if ( typeof obj.appid != 'string' && typeof obj.appid != 'number') error = 'invalid appid';
      if ( typeof obj.count != 'string' && typeof obj.count != 'number') error = 'invalid count';
      if ( typeof obj.maxlength != 'string' && typeof obj.maxlength != 'number') error = 'invalid maxlength';
      break;
    case 'getGlobalAchievementPercentagesForApp':
      if ( typeof obj.gameid != 'string' && typeof obj.gameid != 'number') error = 'invalid gameid';
      if (!obj.gameid) error = "invalid gameid";
      break;
    case 'getPlayerSummaries':
      if (!obj.steamids) {
        error = 'invalid steamids';
      }
      if (typeof obj.steamids == 'object' && !obj.steamids.length) {
        error = 'getPlayerSummaries steamids only accepts a string or array of strings';
      }
      if (typeof obj.steamids == 'object' && obj.steamids.length > 100) error = 'too many steamids';
      break;
    case 'getFriendList':
      if (!obj.steamid) {
        error = 'invalid steamid';
      }
      break;
    case 'getSchema':
      if (!obj.gameid || (typeof obj.gameid != 'string' && typeof obj.gameid != 'number')) {
        error = 'invalid gameid';
      }
      break;
    case 'getPlayerItems':
      if (!obj.gameid || (typeof obj.gameid != 'string' && typeof obj.gameid != 'number')) {
        error = 'invalid gameid';
      }
      if (typeof obj.steamid != 'string') {
        error = 'getPlayerItems steamid argument only accepts a string';
      }
      break;
    case 'getOwnedGames':
      if (!obj.steamid) {
        error = 'invalid steamid';
      }
      break;
    case 'getAssetPrices':
      if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
        error = 'invalid gameid';
      }
      break;
    case 'getAssetClassInfo':
      if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
        error = 'invalid gameid';
      }
      if (obj.classIds && !obj.class_count && !obj.classIds.length) {
        error = 'classIds convenience property must be array of numbers or strings';
      }
      break;
    case 'getPlayerAchievements':
      if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
        error = 'invalid gameid';
      }
      if (!obj.steamid || (typeof obj.steamid != 'string' && typeof obj.steamid != 'number')) {
        error = 'invalid steamid';
      }
      if (obj.l && typeof obj.l != 'string') {
        error = 'invalid language';
      }
      break;
      case 'getRecentlyPlayedGames':
        if (!obj.steamid) {
          error = 'invalid steamid';
        }
      break;
      case 'getUserStatsForGame':
        if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
          error = 'invalid appid';
        }
        if(!obj.steamid || (typeof obj.steamid != 'string' && typeof obj.steamid != 'number')) {
          error = 'invalid steamid';
        }
      break;
      case 'getGlobalStatsForGame':
        if (!obj.name || !Array.isArray(obj.name)) {
          error = 'invalid name';
        }
        if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
          error = 'invalid appid';
        }
        if (!obj.count || (typeof obj.count != 'string' && typeof obj.count != 'number') || obj.count != obj.name.length) {
          // Could this be created internally if name isn't an array or something else weird?
          error = 'invalid count on name argument';
        }
      break;
      case 'isPlayingSharedGame':
        if (!obj.steamid || (typeof obj.steamid != 'string' && typeof obj.steamid != 'number')) {
          error = 'invalid steamid';
        }
        if (!obj.appid_playing || (typeof obj.appid_playing != 'string' && typeof obj.appid_playing != 'number')) {
          error = 'invalid appid_playing';
        }
      break;
      case 'getSchemaForGame':
        if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
          error = 'invalid appid';
        }
      break;
      case 'getPlayerBans':
        if (!obj.steamids) {
          error = 'invalid steamids';
        }
        if (typeof obj.steamids == 'object' && !obj.steamids.length) {
          error = 'getPlayerBans steamids only accepts a string or array of strings';
        }
        if (typeof obj.steamids == 'object' && obj.steamids.length > 100) error = 'too many steamids';
      break;
      case 'getServersAtAddress':
        if (!obj.addr || typeof obj.addr != 'string' || !this.validateIPv4(obj.addr)) {
          error = 'invalid addr';
        }
      break;
      case 'upToDateCheck':
        if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
          error = 'invalid appid';
        }
        if (!obj.version || (typeof obj.version != 'string' && typeof obj.version != 'number')) {
          error = 'invalid version';
        }
      break;
      case 'getUserGroupList':
        if (!obj.steamid || (typeof obj.steamid != 'string' && typeof obj.steamid != 'number')) {
          error = 'invalid steamid';
        }
      break;
      case 'resolveVanityURL':
        if (!obj.vanityurl || typeof obj.vanityurl != 'string') {
          error = 'invalid vanityurl'
        }
      break;
      case 'getNumberOfCurrentPlayers':
        if (!obj.appid || (typeof obj.appid != 'string' && typeof obj.appid != 'number')) {
          error = 'invalid appid';
        }
      break;
      case 'getSteamLevel':
        if (!obj.steamid || (typeof obj.steamid != 'string' && typeof obj.steamid != 'number')) {
          error = 'invalid steamid';
        }
      break;
      case 'getBadges':
        if (!obj.steamid || (typeof obj.steamid != 'string' && typeof obj.steamid != 'number')) {
          error = 'invalid steamid';
        }
      break;
      case 'getCommunityBadgeProgress':
        if (!obj.steamid || (typeof obj.steamid != 'string' && typeof obj.steamid != 'number')) {
          error = 'invalid steamid';
        }
        if (typeof obj.badgeid != 'string' && typeof obj.badgeid != 'number') {
          error = 'invalid badgeid';
        }
      break;
      case 'getSchemaURL':
        if (!obj.gameid || (typeof obj.gameid != 'string' && typeof obj.gameid != 'number')) {
          error = 'invalid gameid';
        }
        if (obj.language && typeof obj.language != 'string') {
          error = 'invalid language';
        }
      break;
      case 'getStoreMetadata':
        if (!obj.gameid || (typeof obj.gameid != 'string' && typeof obj.gameid != 'number')) {
          error = 'invalid gameid';
        }
        if (obj.language && typeof obj.language != 'string') {
          error = 'invalid language';
        }
      break;
      case 'getStoreStatus':
        if (!obj.gameid || (typeof obj.gameid != 'string' && typeof obj.gameid != 'number')) {
          error = 'invalid gameid';
        }
      break;
  }
  if (error) {
    obj.callback(error);
    return false;
  }
  return true;
}

//some of the newer methods use an appid key instead of a gameid key.  This normalizes.
steam.prototype.normalizeAppGameId = function(obj) {
  if (obj.appid && !obj.gameid) {
    obj.gameid = obj.appid;
  } else if (obj.gameid && !obj.appid) {
    obj.appid = obj.gameid;
  }
  return obj;
}

//validate ipv4 address to use with GetServersAtAddress
steam.prototype.validateIPv4 = function(ip) {
  var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/g;
  return ip.match(ipformat);
}

//internal method used to actually make the request to the steam servers
steam.prototype.makeRequest = function(obj) {
  var err;
  var format = this.format;
  //clean up the object to get ready to send it to the API
  var callback = obj.callback;
  delete obj.callback;
  var path = obj.path;
  delete obj.path;
  obj.key = this.apiKey;
  obj.format = this.format;

  //generate the path
  path += qs.stringify(obj);
  var options = {
    host: 'api.steampowered.com',
    port: 80,
    path: path
  };
  var req = http.get(options, function(res) {
    var resData = '';
    var statusCode = res.statusCode;
    res.on('data', function (chunk) {
      resData+=chunk;
    });
    res.on('end', function(){
      if (statusCode == 404) {
        callback('404 Error was returned from steam API');
        return;
      } else if (statusCode == 403) {
        callback('403 Error: Check your API key is correct');
        return;
      }

      if (format == 'json') {
        try {
          resData = JSON.parse(resData);
        } catch (e) {
          callback('JSON response invalid, your API key is most likely wrong');
          return;
        }
      }

      if (  typeof resData.result != 'undefined' &&
            typeof resData.result.status != 'undefined' &&
            resData.result.status != 1) {
        callback(err, resData);
        return;
      }
      callback(err,resData);
    })
  }).on('error', function(error) {
    callback(error);
  })

}
module.exports = steam;
