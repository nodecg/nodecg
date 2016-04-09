The Asset system enables bundle authors to provide a means for end users to upload custom files from the dashboard
for use in the bundle. To enable the Asset system in a bundle, add code like the following to your bundle's `package.json`:
```json
{
  "name": "test-bundle",
  "nodecg": {
    "assetCategories": [
      {
        "name": "thumbnails",
        "title": "Thumbnails",
        "allowedTypes": [
          "jpg",
          "jpeg",
          "gif",
          "png"
        ]
      },
      {
        "name": "boxart",
        "title": "Boxart",
        "allowedTypes": [
          "jpg",
          "jpeg",
          "gif",
          "png"
        ]
      }
    ]
  }
}
```

<iframe src='https://gfycat.com/ifr/CharmingFlawedGalago' frameborder='0' scrolling='no' width='640' height='279.47598253275106' allowfullscreen></iframe>

NodeCG will automatically create a Replicant for each `assetCategory` in a bundle. To access these asset Replicants,
declare them as you would any other Replicant in your bundle. For example:
```js
const thumbnails = nodecg.Replicant('assets:thumbnails');
const boxart = nodecg.Replicant('assets:boxart');
```

These Replicants are arrays. Each item in these arrays describes one of the uploaded files:
```json
{
  "base": "square.png",
  "bundleName": "test-bundle",
  "category": "thumbnails",
  "ext": ".png",
  "name": "square",
  "sum": "3f5828ff83eb099fe11a938f25e57afe8745efdc",
  "url": "/assets/test-bundle/thumbnails/square.png"
}
```
