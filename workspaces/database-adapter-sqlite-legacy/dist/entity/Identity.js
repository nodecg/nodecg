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
exports.Identity = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let Identity = class Identity {
    id;
    provider_type;
    /**
     * Hashed password for local, auth token from twitch, etc.
     */
    provider_hash;
    /**
     * Only used by Twitch and Discord providers.
     */
    provider_access_token = null;
    /**
     * Only used by Twitch and Discord providers.
     */
    provider_refresh_token = null;
    user;
};
exports.Identity = Identity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Identity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], Identity.prototype, "provider_type", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], Identity.prototype, "provider_hash", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { nullable: true }),
    __metadata("design:type", Object)
], Identity.prototype, "provider_access_token", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { nullable: true }),
    __metadata("design:type", Object)
], Identity.prototype, "provider_refresh_token", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.identities),
    __metadata("design:type", User_1.User)
], Identity.prototype, "user", void 0);
exports.Identity = Identity = __decorate([
    (0, typeorm_1.Entity)()
], Identity);
//# sourceMappingURL=Identity.js.map