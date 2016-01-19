By bundling the main Node.js executable (`node.exe`) with a NodeCG instance, NodeCG can run from any folder without
an installation process.

1. To start, your NodeCG instance must be fully installed and configured. This means that all `npm` and `bower` dependencies
for both NodeCG and all bundles should be installed. Run the instance once and make sure everything works before continuing.
2. Once you have verified that the instance works and that all dependencies are installed, copy `node.exe` from your Node.js
installation into the root of your NodeCG instance.
3. In the same directory, create a batch file or shell script with the following content:
```
node index.js
```
4. Double-click that batch file/shell script to run NodeCG.

With the above procedure, it is possibly to fully configure a NodeCG instance and put it on a USB stick that can be
run on any PC. This is good for preparing for broadcasts ahead of time where the broadcast PC might not have Node.js, 
git, and a compiler chain installed.
