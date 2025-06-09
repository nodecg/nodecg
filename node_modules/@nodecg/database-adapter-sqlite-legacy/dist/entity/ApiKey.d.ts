import type { ApiKey as ApiKeyModel } from "@nodecg/database-adapter-types";
import { User } from "./User";
export declare class ApiKey implements ApiKeyModel {
    secret_key: string;
    user: User;
}
//# sourceMappingURL=ApiKey.d.ts.map