/* jshint strict: false */
/* global ZeroClipboard */

document.querySelector('#logout').addEventListener('tap', function() {
    window.location.href = '/logout';
});

document.querySelector('#showKey').addEventListener('tap', function() {
    document.querySelector('#key').textContent = Cookies.get('socketToken');
    document.querySelector('#keyDialog').open();
});

var client = new ZeroClipboard(document.querySelector('#copyKey'));

document.querySelector('#resetKey').addEventListener('tap', function() {
    window.socket.emit('regenerateToken', Cookies.get('socketToken'), function(err) {
        if (err) {
            console.error(err);
            return;
        }

        document.location.reload();
    });
})
