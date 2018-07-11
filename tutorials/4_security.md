## What levels of authorization does NodeCG have?
NodeCG has a fairly naive permissions model. There are only two permission levels:

1. Completely unauthorized, with no access to anything
2. Completely authorized, with full access to everything

This is something we want to improve in the future, but right now this is how things are in NodeCG.

"Full access to everything" includes:
- Read/write access to every Replicant in every bundle
- Read/write access to every message in every bundle
- Read access to the full config of every bundle
  - Your bundle configs may include sensitive API keys and passwords. Every user of your NodeCG deployment will have full access to these config values.
  
Therefore, untrusted users must never be given any degree of authorization in your NodeCG instance. They must never be allowed to successfully authenticate with the socket server. If they do, they will have full control over your entire NodeCG instance.
  
## How are users authorized?
NodeCG has two ways of authorizing a user:
1. Reading the value of their `socketToken` cookie.
2. Reading the value of their `key` URL query parameter.
    - This is why the "COPY URL" buttons on the "Graphics" tab of the dashboard include a `?key=YOUR_KEY` at the end of them. It is necessary for the pages to load successfully in OBS.
  
Anyone who gets sent a link which includes a `key` will have full authorization and access to your NodeCG instance. Treat these links with the same secrecy as you would a password, because that's essentially what they are.


## What do I do if one of my keys got leaked?
1. Have the owner of the leaked key navigate to the "Settings" tab on the Dashboard.
2. Click "RESET KEY", and accept the confirmation dialog.

If you are unable to reach the owner of the leaked key:
1. Shutdown your NodeCG instance.
2. Locate the `nodecg/db/tokens.db` file.
3. Either completely delete this file (which will log out every user and reset their keys), or edit out the specific line containing the key which was leaked.
4. Restart NodeCG.
