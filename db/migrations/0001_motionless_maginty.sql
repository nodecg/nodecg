INSERT INTO role (id, name) VALUES ('07e18d80-fa74-4d98-ac18-838c745a480f', 'superuser');
--> statement-breakpoint
INSERT INTO permission (name, id, roleId, entityId, actions) VALUES ('superuser', '923561ef-4186-4370-b7df-f12e64fc7bd2', '07e18d80-fa74-4d98-ac18-838c745a480f', '*', 3);
