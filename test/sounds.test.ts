import fs from "node:fs";
import path from "node:path";

import { beforeEach, expect } from "vitest";

import { SetupContext, setupTest } from "./helpers/setup";
import * as C from "./helpers/test-constants";

const test = await setupTest();

beforeEach<SetupContext>(async ({ graphic }) => {
	await graphic.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				if (window.graphicApi.soundsReady) {
					resolve();
				} else {
					window.addEventListener("ncgSoundsReady", () => {
						resolve();
					});
				}
			}),
	);
});

test("soundCues replicant - should generate the correct defaultValue", ({
	apis,
}) => {
	const rep = apis.extension.Replicant("soundCues", "test-bundle");
	expect(rep.value).toEqual([
		{
			name: "name-only",
			assignable: true,
			volume: 30,
		},
		{
			name: "default-volume",
			defaultVolume: 80,
			assignable: true,
			volume: 80,
		},
		{
			name: "non-assignable",
			assignable: false,
			volume: 30,
		},
		{
			name: "default-file",
			defaultFile: {
				sum: "9f7f2776691fdcb242c1fc72e115f5c24c63273c",
				base: "default-file.ogg",
				ext: ".ogg",
				name: "default-file",
				url: "/sound/test-bundle/default-file/default.ogg",
				default: true,
			},
			assignable: true,
			file: {
				sum: "9f7f2776691fdcb242c1fc72e115f5c24c63273c",
				base: "default-file.ogg",
				ext: ".ogg",
				name: "default-file",
				url: "/sound/test-bundle/default-file/default.ogg",
				default: true,
			},
			volume: 30,
		},
	]);
});

test("soundCues replicant - should remove any persisted cues that are no longer in the bundle manifest", ({
	apis,
}) => {
	const rep = apis.extension.Replicant("soundCues", "remove-persisted-cues");
	expect(rep.value).toEqual([
		{
			name: "persisted-cue-1",
			assignable: true,
			volume: 30,
		},
	]);
});

test("soundCues replicant - should add any cues in the bundle manifest that aren't in the persisted replicant.", ({
	apis,
}) => {
	const rep = apis.extension.Replicant("soundCues", "add-manifest-cues");
	expect(rep.value).toEqual([
		{
			name: "persisted-cue-1",
			assignable: true,
			volume: 30,
		},
		{
			name: "manifest-cue-1",
			assignable: true,
			volume: 30,
		},
	]);
});

test("soundCues replicant - should update any cues in that are in both in the persisted replicant and the bundle manifest.", ({
	apis,
}) => {
	const rep = apis.extension.Replicant("soundCues", "update-cues");
	expect(rep.value).toEqual([
		{
			name: "updated-cue",
			defaultFile: {
				base: "default-file.ogg",
				default: true,
				ext: ".ogg",
				name: "default-file",
				sum: "9f7f2776691fdcb242c1fc72e115f5c24c63273c",
				url: "/sound/update-cues/updated-cue/default.ogg",
			},
			assignable: false,
			file: {
				sum: "9f7f2776691fdcb242c1fc72e115f5c24c63273c",
				base: "default-file.ogg",
				ext: ".ogg",
				name: "default-file",
				url: "/sound/update-cues/updated-cue/default.ogg",
				default: true,
			},
			volume: 30,
		},
	]);
});

test("mixer - assignable cues - should list new sound Assets as they are uploaded", async ({
	dashboard,
}) => {
	/*
	 1. Switch to Dashboard tab
	 2. Add a sound file directly to nodecg/assets/test-bundle/sounds
	 3. Check the list of options in the dropdown select for all assignable cues
	 */
	const oggPath = path.join(C.assetsRoot(), "test-bundle/sounds/success.ogg");
	fs.copyFileSync(
		"test/fixtures/nodecg-core/assets/test-bundle/sounds/success.ogg",
		oggPath,
	);

	const ret = await dashboard.evaluate(
		async () =>
			new Promise<string | void>((resolve) => {
				const el = (document as any)
					.querySelector("ncg-dashboard")
					.shadowRoot.querySelector("ncg-mixer")
					.shadowRoot.querySelector('ncg-sounds[bundle-name="test-bundle"]')
					.shadowRoot.querySelector("ncg-sound-cue:nth-child(1)").$.select
					.$.select;

				if (!el) {
					resolve("NoSuchElement");
					return;
				}

				const interval = setInterval(() => {
					const { options } = el;
					if (options.length === 2 && options[1].value === "success.ogg") {
						clearInterval(interval);
						resolve();
					}
				}, 50);
			}),
	);

	expect(ret).not.toBe("NoSuchElement");
});

test('client api - should emit "ncgSoundsReady" once all the sounds have loaded', async ({
	graphic,
}) => {
	await graphic.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				if (window.graphicApi.soundsReady) {
					resolve();
				} else {
					window.addEventListener("ncgSoundsReady", () => {
						resolve();
					});
				}
			}),
	);
});

test("client api - #playSound should return a playing AbstractAudioInstance", async ({
	graphic,
}) => {
	const ret = await graphic.evaluate(
		() => window.graphicApi.playSound("default-file").playState,
	);

	expect(ret).toBe("playSucceeded");
});

test("client api - #stopSound should stop all instances of a cue", async ({
	graphic,
}) => {
	const ret = await graphic.evaluate(() => {
		window.graphicApi.playSound("default-file");
		window.graphicApi.playSound("default-file");
		window.graphicApi.stopSound("default-file");
		return (window as any).createjs.Sound._instances.length;
	});

	expect(ret).toBe(0);
});

test("client api - #stopAllSounds should stop all instances", async ({
	graphic,
}) => {
	const ret = await graphic.evaluate(() => {
		window.graphicApi.playSound("default-file");
		window.graphicApi.playSound("default-file");
		window.graphicApi.stopAllSounds();
		return (window as any).createjs.Sound._instances.length;
	});

	expect(ret).toBe(0);
});
