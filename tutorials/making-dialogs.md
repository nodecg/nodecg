Starting with NodeCG 0.7, all dashboard panels are iframes. This was done to provide full code and style encapsulation,
eliminating the need for bundle authors to worry about what they are putting into the global scope with their panel.
However, because every panel is an iframe, it is not possible for a panel to draw anything outside of its bounding box.
This limitation made having dialogs and modals impossible, among other things. To address this, we created a dedicated
system for displaying dialogs.

A dialog is defined the same as any other dashboard panel would be in [package.json]{@tutorial manifest}, with an
additional `dialog: true` property.

## Opening dialogs
To open a dialog, add a `nodecg-dialog` attribute to any clickable element on one of your panels. For example, this
[`<paper-button>`](https://elements.polymer-project.org/elements/paper-button) element will open the `edit-total` dialog when clicked:
```html
<paper-button id="edit" class="nodecg-configure" nodecg-dialog="edit-total">Edit...</paper-button>
```

## Closing dialogs
By default, a dialog can only be closed by clicking outside of it. Optional confirmation and dismissal buttons can be
added via `package.json`. See the [package.json tutorial]{@tutorial manifest} for information on the `dialogButtons`
property.

When a `confirm` or `dismiss` button is pressed, NodeCG will emit a `dialog-confirmed` or `dialog-dismissed` event
on your dialog's `document`. For example:

```html
// bundles/my-bundle/dashboard/my-dialog.html
<script>
    document.addEventListener('dialog-confirmed', function() {
        // The user pressed the confirm button.
    });
    
    document.addEventListener('dialog-dismissed', function() {
        // The user pressed the dismiss button.
    });
</script>
```
