import github from "@changesets/changelog-github";

export default {
	getReleaseLine: github.getReleaseLine,
	getDependencyReleaseLine: async () => "",
};
