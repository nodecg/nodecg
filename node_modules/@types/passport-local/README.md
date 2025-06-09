# Installation
> `npm install --save @types/passport-local`

# Summary
This package contains type definitions for passport-local (https://github.com/jaredhanson/passport-local).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/passport-local.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/passport-local/index.d.ts)
````ts
/// <reference types="passport"/>

import { Strategy as PassportStrategy } from "passport-strategy";
import express = require("express");

interface IStrategyOptions {
    usernameField?: string | undefined;
    passwordField?: string | undefined;
    session?: boolean | undefined;
    passReqToCallback?: false | undefined;
}

interface IStrategyOptionsWithRequest {
    usernameField?: string | undefined;
    passwordField?: string | undefined;
    session?: boolean | undefined;
    passReqToCallback: true;
}

interface IVerifyOptions {
    message: string;
}

interface VerifyFunctionWithRequest {
    (
        req: express.Request,
        username: string,
        password: string,
        done: (error: any, user?: Express.User | false, options?: IVerifyOptions) => void,
    ): void;
}

interface VerifyFunction {
    (
        username: string,
        password: string,
        done: (error: any, user?: Express.User | false, options?: IVerifyOptions) => void,
    ): void;
}

declare class Strategy extends PassportStrategy {
    constructor(options: IStrategyOptionsWithRequest, verify: VerifyFunctionWithRequest);
    constructor(options: IStrategyOptions, verify: VerifyFunction);
    constructor(verify: VerifyFunction);

    name: string;
}

````

### Additional Details
 * Last updated: Tue, 07 Nov 2023 09:09:39 GMT
 * Dependencies: [@types/express](https://npmjs.com/package/@types/express), [@types/passport](https://npmjs.com/package/@types/passport), [@types/passport-strategy](https://npmjs.com/package/@types/passport-strategy)

# Credits
These definitions were written by [Maxime LUCE](https://github.com/SomaticIT).
