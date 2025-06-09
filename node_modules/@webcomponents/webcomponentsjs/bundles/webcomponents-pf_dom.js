/**
@license @nocompile
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
(function(){/*

 Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at
 http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 Google as part of the polymer project is also subject to an additional IP
 rights grant found at http://polymer.github.io/PATENTS.txt
*/
'use strict';function aa(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}function h(a){var b="undefined"!=typeof Symbol&&Symbol.iterator&&a[Symbol.iterator];return b?b.call(a):{next:aa(a)}}var k=document.createEvent("Event");k.initEvent("foo",!0,!0);k.preventDefault();
if(!k.defaultPrevented){var ba=Event.prototype.preventDefault;Event.prototype.preventDefault=function(){this.cancelable&&(ba.call(this),Object.defineProperty(this,"defaultPrevented",{get:function(){return!0},configurable:!0}))}}var l=/Trident/.test(navigator.userAgent);
if(!window.Event||l&&"function"!==typeof window.Event){var m=window.Event;window.Event=function(a,b){b=b||{};var d=document.createEvent("Event");d.initEvent(a,!!b.bubbles,!!b.cancelable);return d};if(m){for(var n in m)window.Event[n]=m[n];window.Event.prototype=m.prototype}}
if(!window.CustomEvent||l&&"function"!==typeof window.CustomEvent)window.CustomEvent=function(a,b){b=b||{};var d=document.createEvent("CustomEvent");d.initCustomEvent(a,!!b.bubbles,!!b.cancelable,b.detail);return d},window.CustomEvent.prototype=window.Event.prototype;
if(!window.MouseEvent||l&&"function"!==typeof window.MouseEvent){var p=window.MouseEvent;window.MouseEvent=function(a,b){b=b||{};var d=document.createEvent("MouseEvent");d.initMouseEvent(a,!!b.bubbles,!!b.cancelable,b.view||window,b.detail,b.screenX,b.screenY,b.clientX,b.clientY,b.ctrlKey,b.altKey,b.shiftKey,b.metaKey,b.button,b.relatedTarget);return d};if(p)for(var q in p)window.MouseEvent[q]=p[q];window.MouseEvent.prototype=p.prototype};var r,ca=function(){function a(){e++}var b=!1,d=!1,c={get capture(){return b=!0},get once(){return d=!0}},e=0,f=document.createElement("div");f.addEventListener("click",a,c);var g=b&&d;g&&(f.dispatchEvent(new Event("click")),f.dispatchEvent(new Event("click")),g=1==e);f.removeEventListener("click",a,c);return g}(),t=null!==(r=window.EventTarget)&&void 0!==r?r:window.Node;
if(!ca&&"addEventListener"in t.prototype){var u=function(a){if(!a||"object"!==typeof a&&"function"!==typeof a){var b=!!a;a=!1}else b=!!a.capture,a=!!a.once;return{capture:b,once:a}},da=t.prototype.addEventListener,v=t.prototype.removeEventListener,ea=new WeakMap,fa=new WeakMap,w=function(a,b,d){var c=d?ea:fa;d=c.get(a);void 0===d&&c.set(a,d=new Map);a=d.get(b);void 0===a&&d.set(b,a=new WeakMap);return a};t.prototype.addEventListener=function(a,b,d){var c=this;if(null!=b){d=u(d);var e=d.capture;d=
d.once;var f=w(this,a,e);if(!f.has(b)){var g=d?function(U){f.delete(b);v.call(c,a,g,e);if("function"===typeof b)return b.call(c,U);if("function"===typeof(null===b||void 0===b?void 0:b.handleEvent))return b.handleEvent(U)}:null;f.set(b,g);da.call(this,a,null!==g&&void 0!==g?g:b,e)}}};t.prototype.removeEventListener=function(a,b,d){if(null!=b){d=u(d).capture;var c=w(this,a,d),e=c.get(b);void 0!==e&&(c.delete(b),v.call(this,a,null!==e&&void 0!==e?e:b,d))}}};/*

Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
Object.getOwnPropertyDescriptor(Node.prototype,"baseURI")||Object.defineProperty(Node.prototype,"baseURI",{get:function(){var a=(this.ownerDocument||this).querySelector("base[href]");return a&&a.href||window.location.href},configurable:!0,enumerable:!0});/*

Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
part of the polymer project is also subject to an additional IP rights grant
found at http://polymer.github.io/PATENTS.txt
*/
var x,y,z=Element.prototype,A=null!==(x=Object.getOwnPropertyDescriptor(z,"attributes"))&&void 0!==x?x:Object.getOwnPropertyDescriptor(Node.prototype,"attributes"),ha=null!==(y=null===A||void 0===A?void 0:A.get)&&void 0!==y?y:function(){return this.attributes},ia=Array.prototype.map;z.hasOwnProperty("getAttributeNames")||(z.getAttributeNames=function(){return ia.call(ha.call(this),function(a){return a.name})});var B,C=Element.prototype;C.hasOwnProperty("matches")||(C.matches=null!==(B=C.webkitMatchesSelector)&&void 0!==B?B:C.msMatchesSelector);/*

Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
var ja=Node.prototype.appendChild;function D(a){a=a.prototype;a.hasOwnProperty("append")||Object.defineProperty(a,"append",{configurable:!0,enumerable:!0,writable:!0,value:function(b){for(var d=[],c=0;c<arguments.length;++c)d[c]=arguments[c];d=h(d);for(c=d.next();!c.done;c=d.next())c=c.value,ja.call(this,"string"===typeof c?document.createTextNode(c):c)}})}D(Document);D(DocumentFragment);D(Element);var E,F,ka=Node.prototype.insertBefore,la=null!==(F=null===(E=Object.getOwnPropertyDescriptor(Node.prototype,"firstChild"))||void 0===E?void 0:E.get)&&void 0!==F?F:function(){return this.firstChild};
function G(a){a=a.prototype;a.hasOwnProperty("prepend")||Object.defineProperty(a,"prepend",{configurable:!0,enumerable:!0,writable:!0,value:function(b){for(var d=[],c=0;c<arguments.length;++c)d[c]=arguments[c];c=la.call(this);d=h(d);for(var e=d.next();!e.done;e=d.next())e=e.value,ka.call(this,"string"===typeof e?document.createTextNode(e):e,c)}})}G(Document);G(DocumentFragment);G(Element);var H,I,ma=Node.prototype.appendChild,na=Node.prototype.removeChild,oa=null!==(I=null===(H=Object.getOwnPropertyDescriptor(Node.prototype,"firstChild"))||void 0===H?void 0:H.get)&&void 0!==I?I:function(){return this.firstChild};
function J(a){a=a.prototype;a.hasOwnProperty("replaceChildren")||Object.defineProperty(a,"replaceChildren",{configurable:!0,enumerable:!0,writable:!0,value:function(b){for(var d=[],c=0;c<arguments.length;++c)d[c]=arguments[c];for(;null!==(c=oa.call(this));)na.call(this,c);d=h(d);for(c=d.next();!c.done;c=d.next())c=c.value,ma.call(this,"string"===typeof c?document.createTextNode(c):c)}})}J(Document);J(DocumentFragment);J(Element);var K,L,M,N,pa=Node.prototype.insertBefore,qa=null!==(L=null===(K=Object.getOwnPropertyDescriptor(Node.prototype,"parentNode"))||void 0===K?void 0:K.get)&&void 0!==L?L:function(){return this.parentNode},ra=null!==(N=null===(M=Object.getOwnPropertyDescriptor(Node.prototype,"nextSibling"))||void 0===M?void 0:M.get)&&void 0!==N?N:function(){return this.nextSibling};
function O(a){a=a.prototype;a.hasOwnProperty("after")||Object.defineProperty(a,"after",{configurable:!0,enumerable:!0,writable:!0,value:function(b){for(var d=[],c=0;c<arguments.length;++c)d[c]=arguments[c];c=qa.call(this);if(null!==c){var e=ra.call(this);d=h(d);for(var f=d.next();!f.done;f=d.next())f=f.value,pa.call(c,"string"===typeof f?document.createTextNode(f):f,e)}}})}O(CharacterData);O(Element);var P,Q,sa=Node.prototype.insertBefore,ta=null!==(Q=null===(P=Object.getOwnPropertyDescriptor(Node.prototype,"parentNode"))||void 0===P?void 0:P.get)&&void 0!==Q?Q:function(){return this.parentNode};
function R(a){a=a.prototype;a.hasOwnProperty("before")||Object.defineProperty(a,"before",{configurable:!0,enumerable:!0,writable:!0,value:function(b){for(var d=[],c=0;c<arguments.length;++c)d[c]=arguments[c];c=ta.call(this);if(null!==c){d=h(d);for(var e=d.next();!e.done;e=d.next())e=e.value,sa.call(c,"string"===typeof e?document.createTextNode(e):e,this)}}})}R(CharacterData);R(Element);var S,T,ua=Node.prototype.removeChild,va=null!==(T=null===(S=Object.getOwnPropertyDescriptor(Node.prototype,"parentNode"))||void 0===S?void 0:S.get)&&void 0!==T?T:function(){return this.parentNode};function V(a){a=a.prototype;a.hasOwnProperty("remove")||Object.defineProperty(a,"remove",{configurable:!0,enumerable:!0,writable:!0,value:function(){var b=va.call(this);b&&ua.call(b,this)}})}V(CharacterData);V(Element);var W,X,wa=Node.prototype.insertBefore,xa=Node.prototype.removeChild,ya=null!==(X=null===(W=Object.getOwnPropertyDescriptor(Node.prototype,"parentNode"))||void 0===W?void 0:W.get)&&void 0!==X?X:function(){return this.parentNode};
function Y(a){a=a.prototype;a.hasOwnProperty("replaceWith")||Object.defineProperty(a,"replaceWith",{configurable:!0,enumerable:!0,writable:!0,value:function(b){for(var d=[],c=0;c<arguments.length;++c)d[c]=arguments[c];c=ya.call(this);if(null!==c){d=h(d);for(var e=d.next();!e.done;e=d.next())e=e.value,wa.call(c,"string"===typeof e?document.createTextNode(e):e,this);xa.call(c,this)}}})}Y(CharacterData);Y(Element);var Z=window.Element.prototype,za=window.HTMLElement.prototype,Aa=window.SVGElement.prototype;!za.hasOwnProperty("classList")||Z.hasOwnProperty("classList")||Aa.hasOwnProperty("classList")||Object.defineProperty(Z,"classList",Object.getOwnPropertyDescriptor(za,"classList"));var Ba=Element.prototype,Ca=Element.prototype.hasAttribute,Da=Element.prototype.setAttribute,Ea=Element.prototype.removeAttribute;Ba.hasOwnProperty("toggleAttribute")||(Ba.toggleAttribute=function(a,b){if(void 0===b){if(Ca.call(this,a))return Ea.call(this,a),!1;Da.call(this,a,"");return!0}if(b)return Ca.call(this,a)||Da.call(this,a,""),!0;Ea.call(this,a);return!1});}).call(this);

//# sourceMappingURL=webcomponents-pf_dom.js.map
