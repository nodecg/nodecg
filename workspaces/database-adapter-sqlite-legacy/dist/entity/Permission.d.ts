import type { Permission as PermissionModel } from "@nodecg/database-adapter-types";
import { Role } from "./Role";
export declare const enum Action {
    NONE = 0,
    READ = 1,
    WRITE = 2
}
export declare class Permission implements PermissionModel {
    id: string;
    name: string;
    role: Role;
    entityId: string;
    actions: number;
}
//# sourceMappingURL=Permission.d.ts.map