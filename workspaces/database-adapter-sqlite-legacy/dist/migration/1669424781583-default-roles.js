"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRoles1669424781583 = void 0;
const ROLE_ID = "07e18d80-fa74-4d98-ac18-838c745a480f";
const PERMISSION_ID = "923561ef-4186-4370-b7df-f12e64fc7bd2";
class defaultRoles1669424781583 {
    async up(queryRunner) {
        await queryRunner.query(`INSERT INTO role (id, name) VALUES ('${ROLE_ID}', 'superuser');`);
        await queryRunner.query(`INSERT INTO permission (name, id, roleId, entityId, actions) VALUES ('superuser', '${PERMISSION_ID}', '${ROLE_ID}', '*', ${1 /* Action.READ */ | 2 /* Action.WRITE */});`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM role WHERE id='$1'`, [ROLE_ID]);
        await queryRunner.query(`DELETE FROM permission WHERE id='$1'`, [
            PERMISSION_ID,
        ]);
    }
}
exports.defaultRoles1669424781583 = defaultRoles1669424781583;
//# sourceMappingURL=1669424781583-default-roles.js.map