'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

module.exports = function (dashboardDir, bundle) {
	const panels = [];

	// If the dashboard folder exists but the nodecg.dashboardPanels property doesn't, throw an error.
	if (fs.existsSync(dashboardDir) && typeof bundle.dashboardPanels === 'undefined') {
		throw new Error(`${bundle.name} has a "dashboard" folder, ` +
			'but no "nodecg.dashboardPanels" property was found in its package.json');
	}

	// If nodecg.dashboardPanels exists but the dashboard folder doesn't, throw an error.
	if (!fs.existsSync(dashboardDir) && typeof bundle.dashboardPanels !== 'undefined') {
		throw new Error(`${bundle.name} has a "nodecg.dashboardPanels" property in its package.json, ` +
			'but no "dashboard" folder');
	}

	// If neither the folder nor the manifest exist, return an empty array.
	if (!fs.existsSync(dashboardDir) && typeof bundle.dashboardPanels === 'undefined') {
		return panels;
	}

	bundle.dashboardPanels.forEach((panel, index) => {
		const missingProps = [];
		if (typeof panel.name === 'undefined') {
			missingProps.push('name');
		}

		if (typeof panel.title === 'undefined') {
			missingProps.push('title');
		}

		if (typeof panel.file === 'undefined') {
			missingProps.push('file');
		}

		if (missingProps.length) {
			throw new Error(`Panel #${index} could not be parsed as it is missing the following properties: ` +
				`${missingProps.join(', ')}`);
		}

		// Check if this bundle already has a panel by this name
		const dupeFound = panels.some(p => p.name === panel.name);
		if (dupeFound) {
			throw new Error(`Panel #${index} (${panel.name}) has the same name as another panel in ${bundle.name}.`);
		}

		const filePath = path.join(dashboardDir, panel.file);

		// Check that the panel file exists, throws error if it doesn't
		if (!fs.existsSync(filePath)) {
			throw new Error(`Panel file "${panel.file}" in bundle "${bundle.name}" does not exist.`);
		}

		// This fixes some harder to spot issues with Unicode Byte Order Markings in dashboard HTML.
		const panelStr = fs.readFileSync(filePath, 'utf8');
		const $ = cheerio.load(panelStr.trim());

		// We used to need to check for a <head> tag, but modern versions of Cheerio add this for us automatically!

		// Check that the panel has a DOCTYPE
		const html = $.html();
		if (!html.match(/(<!doctype )/ig)) {
			throw new Error(`Panel "${path.basename(panel.file)}" in bundle "${bundle.name}" has no DOCTYPE,` +
				'panel resizing will not work. Add <!DOCTYPE html> to it.');
		}

		// Error if this panel is a dialog but also has a workspace defined
		if (panel.dialog && panel.workspace) {
			throw new Error(`Dialog "${path.basename(panel.file)}" in bundle "${bundle.name}" has a "workspace" ` +
				'configured. Dialogs don\'t get put into workspaces. Either remove the "workspace" property from ' +
				'this dialog, or turn it into a normal panel by setting "dialog" to false.');
		}

		if (panel.dialog && panel.fullbleed) {
			throw new Error(`Panel "${path.basename(panel.file)}" in bundle "${bundle.name}" is fullbleed, ` +
				'but it also a dialog. Fullbleed panels cannot be dialogs. Either set fullbleed or dialog ' +
				'to false.');
		}

		if (panel.fullbleed && panel.workspace) {
			throw new Error(`Panel "${path.basename(panel.file)}" in bundle "${bundle.name}" is fullbleed, ` +
				'but it also has a workspace defined. Fullbleed panels are not allowed to define a workspace, ' +
				'as they are automatically put into their own workspace. Either set fullbleed to ' +
				'false or remove the workspace property from this panel.');
		}

		if (panel.fullbleed && typeof panel.width !== 'undefined') {
			throw new Error(`Panel "${path.basename(panel.file)}" in bundle "${bundle.name}" is fullbleed, ` +
				'but it also has a width defined. Fullbleed panels have their width set based on the, ' +
				'width of the browser viewport. Either set fullbleed to ' +
				'false or remove the width property from this panel.');
		}

		panel.path = filePath;
		panel.width = panel.width || 1;
		panel.dialog = Boolean(panel.dialog); // No undefined please
		panel.fullbleed = Boolean(panel.fullbleed);
		panel.headerColor = panel.headerColor || '#525F78';
		panel.bundleName = bundle.name;

		if (!panel.dialog) {
			panel.workspace = panel.workspace ? panel.workspace.toLowerCase() : 'default';
			if (panel.workspace.startsWith('__nodecg')) {
				throw new Error(`Panel "${path.basename(panel.file)}" in bundle "${bundle.name}" is in a workspace ` +
					'whose name begins with __nodecg, which is a reserved string. Please change the name ' +
					'of this workspace to not begin with this string.');
			}
		}

		panel.html = $.html();

		panels.push(panel);
	});

	return panels;
};
