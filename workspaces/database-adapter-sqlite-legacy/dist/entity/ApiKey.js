"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let ApiKey = class ApiKey {
    secret_key;
    user;
};
exports.ApiKey = ApiKey;
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    (0, typeorm_1.Generated)("uuid"),
    __metadata("design:type", String)
], ApiKey.prototype, "secret_key", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.apiKeys),
    __metadata("design:type", User_1.User)
], ApiKey.prototype, "user", void 0);
exports.ApiKey = ApiKey = __decorate([
    (0, typeorm_1.Entity)()
], ApiKey);
//# sourceMappingURL=ApiKey.js.map