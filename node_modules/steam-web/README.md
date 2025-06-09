# steam-web

A [node.js](http://github.com/joyent/node) wrapper for Valve's [Steam Web API](http://developer.valvesoftware.com/wiki/Steam_Web_API).  Also supports the methods provided for [TF2/TF2Beta/Portal](http://wiki.teamfortress.com/wiki/WebAPI).

Use of the API requires an API key, obtainable [here](http://steamcommunity.com/dev/apikey).

This implementation is not supported, endorsed, or created by Valve - I'm just a fan.  This is just a wrapper - all of Valve's terms and conditions for using their API still apply, see the [Steam community developer page](http://steamcommunity.com/dev) for additional information.

## Installation

  npm install steam-web


### Methods

  All methods accept a single options object.  The key names match the query string parameters specified in the valve documentation. See usage and the valve documentation for any additional params.

  If using JSON for results (default), the result will automatically be parsed into a json object before being passed to the callback.  Any other formats will return the raw data (xml or vdf).

####getNewsForApp


####getGlobalAchievementPercentagesForApp


####getPlayerSummaries


####getFriendList


####getSchema


####getPlayerItems


####getAssetPrices


####getAssetClassInfo


####getPlayerAchievements


####getRecentlyPlayedGames


####getUserStatsForGame


####getOwnedGames


####getGlobalStatsForGame


####isPlayingSharedGame


####getSchemaForGame


####getPlayerBans


####getAppList


####getServersAtAddress


####upToDateCheck


####getUserGroupList


####resolveVanityURL


####getNumberOfCurrentPlayers


####getSteamLevel


####getBadges


####getCommunityBadgeProgress


####getServerInfo


####getSupportedAPIList


####getSchemaURL


####getStoreMetadata


####getStoreStatus


## Usage

    var steam = require('steam-web');

    var s = new steam({
      apiKey: 'XXXXXXXXXXXXXXXX',
      format: 'json' //optional ['json', 'xml', 'vdf']
    });

    s.getNewsForApp({
      appid: 440,
      count: 3,
      maxlength: 300,
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getGlobalAchievementPercentagesForApp({
      gameid: 440,
      callback: function(err, data) {
        console.log(data);
      }
    });
    s.getPlayerSummaries({
      steamids: ['76561198037414410', '76561197960435530'],
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getFriendList({
      steamid: '76561197960435530',
      relationship: 'all', //'all' or 'friend'
      callback: function(err,data) {
        console.log(data);
      },
    })
    s.getSchema({
      gameid: 440,
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getPlayerItems({
      gameid: 440,
      steamid: '76561197960435530',
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getAssetPrices({
      appid: 440,  //can also use gameid instead for convenience
      callback: function(err,data) {
        console.log(data);
      }
    })
    s.getPlayerAchievements({
      gameid: 440,
      steamid: '76561197960435530',
      l: 'en',
      callback: function(err,data) {
        console.log(data);
      }
    })
    s.getRecentlyPlayedGames({
      steamid: '76561197960435530',
      callback: function(err,data) {
        console.log(data)
      }
    })
    s.getOwnedGames({
      steamid: '76561197960435530',
      callback: function(err,data) {
        console.log(data)
      }
    })
    s.getUserStatsForGame({
      steamid: '76561197963506690',
      appid: 730,
      callback: function(err,data) {
        console.log(data);
      }
    })
    s.getGlobalStatsForGame({
        appid: 17740,
        name: ["global.map.emp_isle"], // can also pass a single string
        count: 1, // or you can let the module work it out for you
        callback: function(err,data) {
            console.log(data);
        }
    })
    s.isPlayingSharedGame({
        steamid: '76561198120639625',
        appid_playing: 730,
        callback: function(err,data) {
          console.log(data);
        }
    })
    s.getSchemaForGame({
        appid: 730,
        callback: function(err,data) {
          console.log(data);
        }
    })
    s.getPlayerBans({
        steamids: ['76561198120639625'], // can also pass a single string
        callback: function(err,data) {
          console.log(data);
        }
    })
    s.getAppList({
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getServersAtAddress({
      addr: '193.192.58.116',
      callback: function(err, data) {
        console.log(data);
      }
    })    
    s.upToDateCheck({
      version: 100,
      appid: 440,
      callback: function(err, data) {
        console.log(data);
      }
    })  
    s.getUserGroupList({
      steamid: '76561197960435530',
      callback: function(err, data) {
        console.log(data);
      }
    })    
    s.resolveVanityURL({
      vanityurl: 'vincegogh',
      callback: function(err, data) {
        console.log(data);
      }
    })  
    s.getNumberOfCurrentPlayers({
      appid: 440,
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getSteamLevel({
      steamid: '76561197960435530',
      callback: function(err, data) {
        console.log(data);
      }
    })    
    s.getBadges({
      steamid: '76561197960435530',
      callback: function(err, data) {
        console.log(data);   
      }
    })
    s.getCommunityBadgeProgress({
      steamid: '76561197960435530',
      badgeid: 2,
      callback: function(err, data) {
        console.log(data);
      }
    })  
    s.getServerInfo({
      callback: function(err, data) {
        console.log(data);
      }
    })    
    s.getSupportedAPIList({
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getSchemaURL({
      appid: 440,
      callback: function(err, data) {
        console.log(data);
      }
    })    
    s.getStoreMetadata({
      appid: 440,
      callback: function(err, data) {
        console.log(data);
      }
    })
    s.getStoreStatus({
      appid: 440,
      callback: function(err, data) {
        console.log(data);
      }
    })  

    There are two ways to use getAssetClassInfo.  By default, the Steam API
    wants a query string formatted as: ?classid0=1234&classid1=5678&class_count=2

    As such, you can either manually generate the keys and call the method like this:

    s.getAssetClassInfo({
      appid: 440, //can also use gameid instead for convenience
      classid0: '16891096',
      classid1: 151,
      class_count: 2,
      callback: function(err,data) {
        console.log(data);
      }
    })

    OR, we have provided a convenience property so you can just pass an array of ids
    (when using the convenience property, you don't need to pass class_count either)

    s.getAssetClassInfo({
      appid: 440, //can also use gameid instead for convenience
      classIds: ['16891096',151],
      callback: function(err,data) {
        console.log(data);
      }
    })


## Changes

####0.4.0
* Added getAppList
* Added getServersAtAddress
* Added upToDateCheck
* Added getUserGroupList
* Added resolveVanityURL
* Added getNumberOfCurrentPlayers
* Added getSteamLevel
* Added getBadges
* Added getCommunityBadgeProgress
* Added getServerInfo
* Added getSupportedAPIList
* Added getSchemaURL
* Added getStoreMetadata
* Added getStoreStatus
* Updated Readme and tests
* Updated AUTHORS file

####0.3.0
* Added getGlobalStatsForGame
* Added isPlayingSharedGame
* Added getSchemaForGame
* Added getPlayerBans
* Replaced tests with chai/mocha
* Updated Readme
* Added AUTHORS file

####0.2.5
* Added error handling for invalid api keys
* Added tests and README

####0.2.4
* Added getUserStatsForGame
* Updated README and tests, added gitignore

####0.2.3
* Added getOwnedGames
* Added getRecentlyPlayedGames
* Add getPlayerAchievements method
* Add an error handler to the HTTP get request. This will capture ETIMEDOUT and other connections errors.
* Updated README and tests with new methods

####0.2.1
* Changed npm module to steam-web to allow https://github.com/seishun/node-steam to use steam npm module name, update your dependencies.

####0.1.3
* Implemented new API methods from 12/1/2011 update: getAssetClassInfo, getAssetPrices, and getFriendList
* Fixed bug where callbacks were fired twice for certain error events
* Added convenience property to getAssetClassInfo (classIds instead of forcing manual property generation)

####0.1.2
* Changed requirements to node >= 0.4.0
* Modified API so first argument of all callbacks is err (to correspond with standard practices)
* Additional error handling (though methods will return empty arrays if invalid ids are sent to steam
