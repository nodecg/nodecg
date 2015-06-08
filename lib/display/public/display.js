window.onload = function () {
    window.socket
        .on('error', function(err) {
            if (err.type === 'UnauthorizedError') {
                window.location.href = '/authError?code='+err.code+'&message='+err.message;
            } else {
                console.error('Unhandled socket error:', err);
                document.querySelector('#socket-error').show();
            }
        });
}
