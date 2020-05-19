import { MigrationInterface, QueryRunner } from 'typeorm';
import { Action } from '../entity/Permission';

const ROLE_ID = '07e18d80-fa74-4d98-ac18-838c745a480f';
const PERMISSION_ID = '923561ef-4186-4370-b7df-f12e64fc7bd2';

export class Initial1586065330368 implements MigrationInterface {
	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`INSERT INTO role (id, name) VALUES ("${ROLE_ID}", "superuser");`);
		await queryRunner.query(
			`INSERT INTO permission (name, id, roleId, entityId, actions) VALUES ("superuser", "${PERMISSION_ID}", "${ROLE_ID}", "*", ${Action.READ |
				Action.WRITE});`,
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DELETE FROM role WHERE id="$1"', [ROLE_ID]);
		await queryRunner.query('DELETE FROM permission WHERE id="$1"', [PERMISSION_ID]);
	}
}
