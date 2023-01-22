module.exports = {
	plugins: [
		[
			'@semantic-release/commit-analyzer',
			{
				preset: 'conventionalcommits',
			},
		],
		[
			'@semantic-release/release-notes-generator',
			{
				preset: 'conventionalcommits',
			},
		],
		'@semantic-release/changelog',
		'@semantic-release/npm',
		[
			'@semantic-release/github',
			{
				assets: [
					{
						path: 'nodecg.zip',
						name: 'NodeCG-${nextRelease.gitTag}.zip',
						label: 'NodeCG (${nextRelease.gitTag}) distribution',
					},
				],
			},
		],
		'@semantic-release/git',
	],
};
