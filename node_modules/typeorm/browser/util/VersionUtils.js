export class VersionUtils {
    static isGreaterOrEqual(version, targetVersion) {
        if (!version) {
            return false;
        }
        const v1 = parseVersion(version);
        const v2 = parseVersion(targetVersion);
        for (let i = 0; i < v1.length && i < v2.length; i++) {
            if (v1[i] > v2[i]) {
                return true;
            }
            else if (v1[i] < v2[i]) {
                return false;
            }
        }
        return true;
    }
}
function parseVersion(version) {
    return version.split(".").map((value) => parseInt(value, 10));
}

//# sourceMappingURL=VersionUtils.js.map
