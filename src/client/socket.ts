import Cookies from 'cookies-js';
import io from 'socket.io-client';

const params = new URLSearchParams(location.search);
window.token = params.get('key') ?? Cookies.get('socketToken');
if (window.token) {
	window.socket = io((undefined as unknown) as string, { query: { token: window.token } });
} else {
	window.socket = io();
}
