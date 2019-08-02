## Examples
Before continuing, you may find it helpful to look over our [collection of simple example bundles](https://github.com/nodecg/nodecg-simple-examples).

## Quick Start
1. [Install Node.js 8 or later](https://nodejs.org/en/):
    - This will also install the `npm` command, which will be used extensively in the following steps.

2. Use nodecg-cli to install an instance of NodeCG:
    ```bash
    npm install --global nodecg-cli
    mkdir nodecg
    cd nodecg
    nodecg setup
    ```
  
3. Use Yeoman and generator-nodecg to generate the beginnings of your new bundle:
    ```bash
    npm install --global yo generator-nodecg
    cd bundles
    mkdir my-first-bundle
    cd my-first-bundle
    yo nodecg
    ```
    
    Answer the prompts one-by-one as they come up.
 
4. Once your template bundle has been generated, start NodeCG:
    ```bash
    cd ../..
    nodecg start
    ```
    
5. Open the NodeCG Dashboard, which will be located at [http://localhost:9090](http://localhost:9090) by default. You should see a page like this:

    ![Dashboard Screenshot](https://raw.githubusercontent.com/nodecg/nodecg/master/media/quickstart_dashboard.png)
6. That's it! You can click the "Graphics" button in the top right to see a list of graphics in your installed bundles.

If you have more questions, want further guidance, or would just like to hang out with other NodeCG devs, [join our Discord server](https://discord.gg/NNmVz4x)!


