If your bundle has a `bower.json`, NodeCG will automatically install the Bower dependencies defined therein on startup.
NodeCG makes your bundle's Bower dependencies available from `/bundle/:bundleName/bower_components/*`. This route
matches the structure of the filesystem, so you will be able to take advantage of your IDE's autocomplete functionality.

```html
<link rel="stylesheet" href="../bower_components/other-component/style.min.css">
<script src="../bower_components/some-component/lib.min.js"></script>
...
```

.. though you can the absolute paths if needed:
```
<script src="/bundles/my-bundle/bower_components/some-component/lib.min.js"></script>
```

If you need to access NodeCG's own Bower dependencies, they are available from the absolute `/bower_components/*` route.
This is not recommended. Any dependencies that your bundle needs should be part of your bundle's `bower.json`,
because NodeCG's Bower dependencies are subject to change without warning.
```html
<!-- Loads NodeCG's copy of the webcomponents.js Polyfill -->
<script src="/bower_components/webcomponentsjs/webcomponents-lite.min.js"></script>
```
