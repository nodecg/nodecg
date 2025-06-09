"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _It_peek;
Object.defineProperty(exports, "__esModule", { value: true });
exports.template = template;
function* parse(value) {
    let index = 0;
    while (index < value.length) {
        if (value[index] === "\\") {
            yield { type: "ESCAPED", index, value: value[index + 1] || "" };
            index += 2;
            continue;
        }
        if (value[index] === "{" && value[index + 1] === "{") {
            yield { type: "{{", index, value: "{{" };
            index += 2;
            continue;
        }
        if (value[index] === "}" && value[index + 1] === "}") {
            yield { type: "}}", index, value: "{{" };
            index += 2;
            continue;
        }
        yield { type: "CHAR", index, value: value[index++] };
    }
    return { type: "END", index, value: "" };
}
class It {
    constructor(tokens) {
        this.tokens = tokens;
        _It_peek.set(this, void 0);
    }
    peek() {
        if (!__classPrivateFieldGet(this, _It_peek, "f")) {
            const next = this.tokens.next();
            __classPrivateFieldSet(this, _It_peek, next.value, "f");
        }
        return __classPrivateFieldGet(this, _It_peek, "f");
    }
    tryConsume(type) {
        const token = this.peek();
        if (token.type !== type)
            return undefined;
        __classPrivateFieldSet(this, _It_peek, undefined, "f");
        return token;
    }
    consume(type) {
        const token = this.peek();
        if (token.type !== type) {
            throw new TypeError(`Unexpected ${token.type} at index ${token.index}, expected ${type}`);
        }
        __classPrivateFieldSet(this, _It_peek, undefined, "f");
        return token;
    }
}
_It_peek = new WeakMap();
/**
 * Fast and simple string templates.
 */
function template(value) {
    const it = new It(parse(value));
    const values = [];
    let text = "";
    while (true) {
        const value = it.tryConsume("CHAR") || it.tryConsume("ESCAPED");
        if (value) {
            text += value.value;
            continue;
        }
        if (text) {
            values.push(text);
            text = "";
        }
        if (it.tryConsume("{{")) {
            const path = [];
            let key = "";
            while (true) {
                const escaped = it.tryConsume("ESCAPED");
                if (escaped) {
                    key += escaped.value;
                    continue;
                }
                const char = it.tryConsume("CHAR");
                if (char) {
                    if (char.value === ".") {
                        path.push(key);
                        key = "";
                        continue;
                    }
                    key += char.value;
                    continue;
                }
                path.push(key);
                it.consume("}}");
                break;
            }
            values.push(getter(path));
            continue;
        }
        it.consume("END");
        break;
    }
    return (data) => {
        let result = "";
        for (const value of values) {
            result += typeof value === "string" ? value : value(data);
        }
        return result;
    };
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
function getter(path) {
    return (data) => {
        let value = data;
        for (const key of path) {
            if (hasOwnProperty.call(value, key)) {
                value = value[key];
            }
            else {
                throw new TypeError(`Missing ${path.map(escape).join(".")} in data`);
            }
        }
        return value;
    };
}
function escape(key) {
    return key.replace(/\./g, "\\.");
}
//# sourceMappingURL=index.js.map