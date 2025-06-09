# Unipointer

Base class for doing one thing with pointer event

Used with [Unidragger](https://github.com/metafizzy/unidragger) and [TapListener](https://github.com/metafizzy/tap-listener)

## Install

Bower: `bower install unipointer`

npm: `npm install unipointer`

## Usage

``` js
// create new class
function PointerFun( elem ) {
  this.element = elem;
  // binds mousedown/touchstart/pointerdown event
  this._bindStartEvent( this.element, true );
}
// inherit Unipointer
PointerFun.prototype = new Unipointer();

// overwrite public pointer methods
PointerFun.prototype.pointerDown = function( event, pointer ) {
  console.log('pointer down');
};

PointerFun.prototype.pointerMove = function( event, pointer ) {
  console.log('pointer move');
};

PointerFun.prototype.pointerUp = function( event, pointer ) {
  console.log('pointer up');
};

PointerFun.prototype.pointerCancel = function( event, pointer ) {
  console.log('pointer cancel');
};

// triggered on pointerUp and pointerCancel 
PointerFun.prototype.pointerDone = function( event, pointer ) {
  console.log('pointer done');
};
```

---

MIT license

By [Metafizzy](https://metafizzy.co)
