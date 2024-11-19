import { type MigrationInterface, type QueryRunner } from 'typeorm';
import { Action } from '../entity/Permission';

const ROLE_ID = '07e18d80-fa74-4d98-ac18-838c745a480f';
const PERMISSION_ID = '923561ef-4186-4370-b7df-f12e64fc7bd2';

const EXTERNAL_ROLE_ID = '39ac5645-323e-464c-b50b-6441d1c72c21';
const EXTERNAL_PERMISSION_ID = '18e1e478-a3ff-406c-a399-131e053de54e';
export class defaultRoles1669424781583 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`INSERT INTO role (id, name) VALUES ('${ROLE_ID}', 'superuser');`);
		await queryRunner.query(
			`INSERT INTO permission (name, id, roleId, entityId, actions) VALUES ('superuser', '${PERMISSION_ID}', '${ROLE_ID}', '*', ${Action.READ | Action.WRITE
			});`,
		);

		await queryRunner.query(`INSERT INTO role (id, name) VALUES ('${EXTERNAL_ROLE_ID}', 'external');`);
		await queryRunner.query(
			`INSERT INTO permission (name, id, roleId, entityId, actions) VALUES ('external', '${EXTERNAL_PERMISSION_ID}', '${EXTERNAL_ROLE_ID}', '*', ${Action.READ | Action.WRITE
			});`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM role WHERE id='$1'`, [ROLE_ID]);
		await queryRunner.query(`DELETE FROM permission WHERE id='$1'`, [PERMISSION_ID]);
		await queryRunner.query(`DELETE FROM role WHERE id='$1'`, [EXTERNAL_ROLE_ID]);
		await queryRunner.query(`DELETE FROM permission WHERE id='$1'`, [EXTERNAL_PERMISSION_ID]);
	}
}
