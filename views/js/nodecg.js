function NodeCG() {
  this.host = <%- host %>;
  this.port = <%- port %>;

  this._socket = io.connect('http://' + this.host + ':' + this.port + '/');

  this.sendMessage = function(messageName, data) {
    this._socket.emit('ncg-' + __ncg__packagename__, {name: messageName, data: data});
  };

  this.listenFor = function(messageName, handler) {
    this._socket.on('ncg-' + __ncg__packagename__, function(data) {
      if (data.name === messageName) {
        handler(data.data);
      }
    });
  };
}

nodecg = new NodeCG();
