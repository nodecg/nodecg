var assert = require("chai").assert;
var Steam = require("../lib/steam");

var APIKEY = require('./key.js');
if (APIKEY === 'xxxxxx') { throw new  Error('Must provide key in ./test/key.js'); }

describe("Steam instance creator", function() {
  it("constructing with no options should throw", function() {
    assert.throws(function() {
      var q = new Steam();
    });
  });
  it("constructing with a bad API key format should throw", function() {
    assert.throws(function() {
      var q = new Steam({
        apiKey: ["some", "bad", "type"],
        format: "json"
      });
    });
  });
  it("constructing with a bad format should throw", function() {
    assert.throws(function() {
      var q = new Steam({
        apiKey: "XXX",
        format: "badformat"
      });
    });
  });
  it("constructing with no format should default to json", function() {
    var q = new Steam({
      apiKey: "XXX"
    });
    assert.equal(q.format, "json");
  });
});

describe("Method object validation", function() {
  var s = {};
  s = new Steam({
    apiKey: APIKEY,
    format: "json"
  });

  describe("GetNewsForApp", function() {
    it("no appid should throw", function() {
      assert.throws(function() {
        s.getNewsForApp({
          count: 3,
          maxlength: 300,
          callback: function(err, data) {
            if (err) throw new Error(err);
          }
        });
      });
    });

    it("no count should throw", function() {
      assert.throws(function() {
        s.getNewsForApp({
          appid: 400,
          maxlength: 300,
          callback: function(err, data) {
            if (err) throw new Error(err);
          }
        });
      });
    });

    it("no maxlength should throw", function() {
      assert.throws(function() {
        s.getNewsForApp({
          appid: 400,
          count: 20,
          callback: function(err, data) {
            if (err) throw new Error(err);
          }
        });
      });
    });
  });

  describe("GetGlobalAchievementPercentagesForApp", function() {
    it("no appid should throw", function() {
      assert.throws(function() {
        s.getGlobalAchievementPercentagesForApp({
          callback: function(err,data) {
            if (err) throw new Error(err);
          }
        });
      });
    });
  });

  describe("GetPlayerSummaries", function() {
    it("no steamids should throw", function() {
      assert.throws(function() {
        s.getPlayerSummaries({
          callback: function(err, data) {
            if (err) throw new Error(err);
          }
        });
      });
    });
    it("bad steamids should throw", function() {
      assert.throws(function() {
        s.getPlayerSummaries({
          callback: function(err, data) {
            if (err) throw new Error(err);
          },
          steamids: {}
        });
      });
    });
  });

  describe("GetSchema", function() {
    it("no appid should throw", function() {
      assert.throws(function() {
        s.getSchema({
          callback: function(err, data) {
            if (err) throw new Error(err);
          },
          gameid: []
        });
      });
    });
  });

  describe("GetPlayerItems", function() {
    it("no appid should throw", function() {
      assert.throws(function() {
        s.getPlayerItems({
          callback: function(err,data) {
            if (err) throw new Error(err);
          },
          gameid: [],
          steamid: '76561197960435530'
        });
      });
    });
    it("no steamids should throw", function() {
      assert.throws(function() {
        s.getPlayerItems({
          callback: function(err,data) {
            if (err) throw new Error(err);
          },
          gameid: 440,
          steamid: {}
        });
      });
    });
    it("bad steamids should not throw", function() {
      assert.doesNotThrow(function() {
        s.getPlayerItems({
          appid: 440,
          steamid: '76123131232313123112',
          callback: function(err,data) {
            if (err) throw new Error(err);
          }
        });
      });
    });
  });

  describe("GetPlayerAchievements", function() {
    it("no appid should throw", function() {
      assert.throws(function() {
        s.getPlayerAchievements({
          callback: function(err,data) {
            if (err) throw new Error(err);
          },
          gameid: [],
          steamid: '76561197960435530'
        });
      });
    });
    it("no steamids should throw", function() {
      assert.throws(function() {
        s.getPlayerAchievements({
          callback: function(err,data) {
            if (err) throw new Error(err);
          },
          gameid: 440,
          steamid: ['']
        });
      });
    });
    it("bad language should throw", function() {
      assert.throws(function() {
        s.getPlayerAchievements({
          callback: function(err,data) {
            if (err) throw new Error(err);
          },
          gameid: 440,
          steamid: '76561197960435530',
          l: ['']
        });
      });
    });
  });

  describe("GetRecentlyPlayedGames", function() {
    it("no steamids should throw", function() {
      assert.throws(function() {
        s.getRecentlyPlayedGames({
          callback: function(err,data) {
            if (err) throw new Error(err);
          }
        });
      });
    });
  });

  describe('GetServersAtAddress', function() {
    it("invalid ip address should throw", function() {
      assert.throws(function() {
        s.getServersAtAddress({
          addr: '1.2.3',
          callback: function(err, data) {
            if (err) throw new Error(err);
          }
        });
      });
    });
  });

});

describe("Request handling", function() {

  it("passing an invalid API key should not throw when request is made", function() {
    var s = new Steam({
      apiKey: "somebadkey",
      format: "json"
    });
    assert.doesNotThrow(function() {
      s.getPlayerSummaries({
        callback: function(err,data) {},
        steamids: ['76561198037414410', '76561197960435530']
      });
    });
  });

  it("querying the wrong URL should warn of 404", function(done) {
    var s = new Steam({
      apiKey: APIKEY,
      format: "json"
    });
    var obj = {
      callback: function(err, data) {
        assert.strictEqual(err, "404 Error was returned from steam API");
        done();
      },
      path: "/some/bad/path/?",
    };
    Steam.prototype.makeRequest(obj);
  });

  it("querying with an invalid API key should warn of 403", function(done) {
    var s = {
      apiKey: "somebadkey",
      format: "json"
    };
    var obj = {
      appid: 440,
      count: 3,
      maxlength: 300,
      callback: function(err, data) {
        assert.strictEqual(err, "403 Error: Check your API key is correct");
        done();
      },
      path: "/IEconItems_440/GetSchema/v0001/?"
    };
    Steam.prototype.makeRequest.call(s, obj);
  });
});

describe("Successful Data Return", function() {
  var s = {};
  s = new Steam({
    apiKey: APIKEY,
    format: "json"
  });

  it("GetNewsForApp", function(done) {
    s.getNewsForApp({
      appid: 440,
      count: 3,
      maxlength: 300,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetGlobalAchievementPercentagesForApp", function(done) {
    s.getGlobalAchievementPercentagesForApp({
      appid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetPlayerSummaries", function(done) {
    s.getPlayerSummaries({
      steamids: ['76561198037414410', '76561197960435530'],
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetFriendList", function(done) {
    s.getFriendList({
      steamid: '76561197960435530',
      relationship: 'all',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetSchema", function(done) {
    s.getSchema({
      gameid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetPlayerItems", function(done) {
    s.getPlayerItems({
      appid: 440,
      steamid: '76561197993520601',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetAssetPrices", function(done) {
    s.getAssetPrices({
      appid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetAssetClassInfo(1)", function(done) {
    s.getAssetClassInfo({
      gameid: 440,
      classid0: '16891096',
      class_count: 1,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetAssetClassInfo(2)", function(done) {
    s.getAssetClassInfo({
      appid: 440,
      classIds: ['16891096',156],
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetPlayerAchievements", function(done) {
    s.getPlayerAchievements({
      gameid: 440,
      steamid: '76561197960435530',
      l: 'en',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetRecentlyPlayedGames", function(done) {
    s.getRecentlyPlayedGames({
      steamid: '76561197960435530',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetUserStatsForGame", function(done) {
    s.getUserStatsForGame({
      steamid: '76561198120639625',
      appid: 730,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetGlobalStatsForGame", function(done) {
    s.getGlobalStatsForGame({
      appid: 17740,
      name: "global.map.emp_isle",
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("IsPlayingSharedGame", function(done) {
    s.isPlayingSharedGame({
      steamid: '76561198120639625',
      appid_playing: 730,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetSchemaForGame", function(done) {
    s.getSchemaForGame({
      appid: 730,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetPlayerBans", function(done) {
    s.getPlayerBans({
      steamids: '76561198120639625',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetAppList", function(done) {
    s.getAppList({
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });

  it("GetServersAtAddress", function(done) {
    s.getServersAtAddress({
      addr: '193.192.58.116',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("UpToDateCheck", function(done) {
    s.upToDateCheck({
      version: 100,
      appid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("GetUserGroupList", function(done) {
    s.getUserGroupList({
      steamid: '76561197960435530',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("ResolveVanityURL", function(done) {
    s.resolveVanityURL({
      vanityurl: 'vincegogh',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("GetNumberOfCurrentPlayers", function(done) {
    s.getNumberOfCurrentPlayers({
      appid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("GetSteamLevel", function(done) {
    s.getSteamLevel({
      steamid: '76561197960435530',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("GetBadges", function(done) {
    s.getBadges({
      steamid: '76561197960435530',
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("GetCommunityBadgeProgress", function(done) {
    s.getCommunityBadgeProgress({
      steamid: '76561197960435530',
      badgeid: 2,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("GetServerInfo", function(done) {
    s.getServerInfo({
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("getSupportedAPIList", function(done) {
    s.getSupportedAPIList({
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("getSchemaURL", function(done) {
    s.getSchemaURL({
      appid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("getStoreMetadata", function(done) {
    s.getStoreMetadata({
      appid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
  it("getStoreStatus", function(done) {
    s.getStoreStatus({
      appid: 440,
      callback: function(err, data) { check(done, function() {
        if (err) return err;
        assert.isObject(data, "Data is not an object");
      }); }
    });
  });
});

/* TEMPLATE:
it("", function(done) {
  s.something({
    callback: function(err, data) { check(done, function() {
      if (err) return err;
      assert.isObject(data, "Data is not an object");
    }); }
  });
});
*/

function check( done, f ) {
  try {
    var x = f();
    if (x) done(new Error(x));
    else done();
  } catch( e ) {
    done(e);
  }
}
