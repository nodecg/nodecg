# Add a Workspace

This document outlines the steps to add a workspace to this repository.

1. Create a new directory in the `workspaces` directory
1. Add package.json with the following content:
   ```json
   {
     "name": "@nodecg/workspace-name",
     "version": "0.0.0",
     "main": "dist/main.js",
     "files": ["dist"],
     "publishConfig": {
       "access": "public"
     }
   }
   ```
1. Add `workspaces/workspace-name` to the `workspaces` array in the root `package.json`
1. Add `@nodecg/workspace-name` to relevant dependencies in package.json
1. Add `"workspaces/workspace-name": "0.0.0"` to .release-please-manifest.json
1. Add `workspaces/workspace-name` to release-please-config.json
   ```json
   {
     "packages": {
       "workspaces/workspaces-name": {
         "release-as": "0.0.1"
       }
     }
   }
   ```
