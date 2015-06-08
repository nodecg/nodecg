var url = new Url;

window.token = url.query.key || Cookies.get('socketToken');

if (window.token) {
    window.socket = io.connect('//' + window.ncgConfig.baseURL + '/', {
        query: 'token=' + window.token
    });
}
else {
    window.socket = io.connect('//' + window.ncgConfig.baseURL + '/');
}
