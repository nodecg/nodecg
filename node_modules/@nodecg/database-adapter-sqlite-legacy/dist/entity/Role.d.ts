import type { Role as RoleModel } from "@nodecg/database-adapter-types";
import { Permission } from "./Permission";
export declare class Role implements RoleModel {
    id: string;
    name: string;
    permissions: Permission[];
}
//# sourceMappingURL=Role.d.ts.map