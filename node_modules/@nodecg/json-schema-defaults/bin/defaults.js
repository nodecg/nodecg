#!/usr/bin/env node

var fs = require('fs')
var defaults = require('json-schema-defaults')

var parser = new require('argparse').ArgumentParser()
parser.addArgument('--indent', { type: 'int', defaultValue: 2 })
parser.addArgument('schema', { help: 'JSON Schema file' })

var args = parser.parseArgs()

fs.readFile(args.schema, 'utf-8', function (err, data) {
	if (err) return console.error('Could not read file "' + args.schema + '"')
	try {
		console.log(JSON.stringify(defaults(JSON.parse(data)), null, args.indent))
	} catch (e) {
		console.error('Invalid JSON Schema')
	}
})
