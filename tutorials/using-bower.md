If your bundle has a `bower.json`, NodeCG will automatically install the Bower dependencies defined therein on startup.
NodeCG makes your bundle's Bower dependencies available from two routes: `/panel/:bundle/components/*` and 
`/graphics/:bundle/components/*`. In practice, this means that your dashboard panels and graphics can use the following
relative paths to load their Bower dependencies:

```html
<link rel="stylesheet" href="components/other-component/style.min.css">
<script src="components/some-component/lib.min.js"></script>
...
```

.. though you can the absolute paths if needed:
```
<!-- Both of these resolve to the same file -->
<script src="/panel/my-bundle/components/some-component/lib.min.js"></script>
<script src="/graphics/my-bundle/components/some-component/lib.min.js"></script>
```

If you need to access NodeCG's own Bower dependencies, they are available from the absolute `/components/*` route.
This is not recommended. Any dependencies that your bundle needs should be part of your bundle's `bower.json`,
because NodeCG's Bower dependencies are subject to change without warning.
```html
<!-- Loads NodeCG's copy of the webcomponents.js Polyfill -->
<script src="/components/webcomponentsjs/webcomponents-lite.min.js"></script>
```
