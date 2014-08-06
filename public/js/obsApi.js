const OBS_REMOTE_DEFAULT_PORT = 4444;
const OBS_REMOTE_WEBSOCKET_PROTOCOL = "obsapi";

function OBSRemote() {
  this.apiVersion = 1.1;

  this._connected = false;
  this._socket = undefined;
}

/**
 * Try to connect to OBS, with optional password
 * @param address "ipAddress:port"
 * @param password Optional authentication password
 */
OBSRemote.prototype.connect = function (address, password) {
  // Password is optional, set to empty string if undefined
  password = (typeof password === "undefined") ? "" : password;

  // Check for port number, if missing use 4444
  var colonIndex = address.indexOf(':');
  if (colonIndex < 0 || colonIndex == address.length - 1) {
    address += ":" + OBS_REMOTE_DEFAULT_PORT;
  }

  // Check if we already have a connection
  if (this._connected) {
    this._socket.close();
    this._connected = false;
  }

  // Connect and setup WebSocket callbacks
  this._socket = new WebSocket("ws://" + address, OBS_REMOTE_WEBSOCKET_PROTOCOL);

  var self = this;

  this._socket.onopen = function (event) {
    self._connected = true;
    self.onConnectionOpened();
  };

  this._socket.onclose = function (code, reason, wasClean) {
    self.onConnectionClosed();
    self._connected = false;
  };

  this._socket.onerror = function (event) {
    self.onConnectionFailed();
    self._connected = false;
  }
};

OBSRemote.prototype.onConnectionOpened = function() {};

OBSRemote.prototype.onConnectionClosed = function() {};

OBSRemote.prototype.onConnectionFailed = function() {};
