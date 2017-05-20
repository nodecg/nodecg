## Breaking Changes
- [Dashboard Panel, Graphics, and Bower Components routes have changed](#routing-changes)

<h3 id="routing-changes)">Routing Changes</h3>
NodeCG's routing has always been a little arbitrary and confusing. It did not match the structure of the filesystem,
and there wasn't really a good reason for this. This arbitrary routing structure was hard to remember and 
prevented bundle authors from taking advantage of their IDE's autocomplete functionality. It also made using
filesystem-aware tools like the [`polymer-bundler`](https://github.com/Polymer/polymer-bundler) 
(formerly called `vulcanize`)  needlessly difficult.

The new routing structure matches the structure of the filesystem, making routes easier to work with
and avoiding certain bugs relating to the de-duplication of HTML Imports (and soon, ES Modules).

Old (don't use these anymore!):
```
/panels/bliz-overwatch/rosters.html
/graphics/bliz-overwatch/roster.html

# Two different routes to the same file! This breaks the de-duplication of HTML Imports and causes errors.
/panels/bliz-overwatch/components/polymer/polymer.html
/graphics/bliz-overwatch/components/polymer/polymer.html
```

New:
```
/bundles/bliz-overwatch/dashboard/rosters.html
/bundles/bliz-overwatch/graphics/roster.html

# Now, there is only one single route to any given file.
/bundles/bliz-overwatch/bower_components/polymer/polymer.html
```
