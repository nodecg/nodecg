# social login example

Log in with Discord through `makeOAuth2Provider`, or Twitch and Google through `makeOidcProvider`.

## Provider setup

| Provider | Create the app at                                 | Callback URL                                                | Env vars                                      |
| -------- | ------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| Discord  | https://discord.com/developers/applications       | `http://localhost:3000/api/authentication/callback/discord` | `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` |
| Twitch   | https://dev.twitch.tv/console/apps                | `http://localhost:3000/api/authentication/callback/twitch`  | `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET`   |
| Google   | https://console.cloud.google.com/apis/credentials | `http://localhost:3000/api/authentication/callback/google`  | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`   |

## Run

```sh
DISCORD_CLIENT_ID=… DISCORD_CLIENT_SECRET=… pnpm dev
```

Open http://localhost:3000/frontend/namespaces/social-login/

- `pnpm dev`: Start the development server
- `pnpm build`: Build the project
- `pnpm start`: Start the production server
