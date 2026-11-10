# NodeCG

Experimental new version of NodeCG in active development from scratch

## API

### Philosophy

- Modular and extensible
- Decoupled client-side that supports both browsers and servers
- Simple and intuitive APIs without pitfalls
- Immutable data structures and updates
- TypeScript first and complete type safety

### Draft

```ts
const roles = defineRoles({
  judge: {
    description: "Judge standing next to the players",
    permission: ["all"], // Or "replicant-read" | "replicant-write" | "computed-read" | "topic-subscribe" | "topic-publish"
  },
  monitor: {
    permission: ["replicant-read", "computed-read", "topic-subscribe"],
  },
  viewer: {
    permission: ["replicant-read", "computed-read"],
  },

  // Reserved role for all users by default
  everyone: {
    permission: ["replicant-read", "computed-read"],
  },
}); // Automatically adds "everyone" which means all users, no permissions

const match = defineNamespace("match", {
  replicant: {
    score: {
      schema: Schema.Struct({ left: Schema.Number, right: Schema.Number }),
      permission: {
        read: {
          deny: [roles.viewer],
        },
      },
    },
    label: {
      schema: Schema.NonEmptyTrimmedString,
      permission: {
        write: {
          allow: [roles.monitor],
        },
      },
    },
  },

  computed: {
    winning: {
      schema: Schema.OptionFromNullOr(Schema.Literal("left", "right")),
      permission: {
        read: {
          deny: [roles.judge],
        },
      },
    },
  },

  // Not yet
  data: {
    upcoming: {
      schema: Schema.Array(Schema.Struct({ id: Schema.UUID /* ... */ })),
    },
  },
  topic: {
    start: {
      schema: Schema.Boolean,
      permission: {
        subscribe: {
          deny: [roles.viewer],
        },
      },
    },
  },
});

// Server-side
const match = implementNamespace(match, {
  seedReplicant: {
    score: () => ({ left: 0, right: 0 }),
    label: () => "Match 1",
  },
  implementComputed: {
    winning: (sources) => {
      const leftAdvantage = sources.score.left - sources.score.right;
      return leftAdvantage > 0 ? "left" : leftAdvantage < 0 ? "right" : null;
    },
  },
});

loadNamespace(match);

// Client-side
const match = loadNamespace(match);

match.replicant.label.subscribe((label) => {
  dom.innerText = label;
});
```

### Shared Replicant

- ✅ Replicant is declarative: defined in one place with name and schema

  ```ts
  const manifest = defineNamespace("match", {
    replicant: { counter: { schema }, games: { schema } },
  });
  ```

- ✅ Replicant is platform agnostic: loaded with a dedicated server or client API

  ```ts
  // Server-side
  import { implementNamespace, loadNamespace } from "@nodecg/server";

  const match = implementNamespace(manifest, {
    seedReplicant: { counter: () => 0, games: () => [] },
  });
  const loaded = await loadNamespace(match);

  console.log(loaded.replicant.counter.get());

  // Client-side
  import { loadNamespace } from "@nodecg/client";

  const ns = await loadNamespace(manifest);
  console.log(await ns.replicant.counter.get()); // asynchronous over the network
  ```

- ✅ Replicant is immutable: read-only value, set or updated by returning a new value from the updater

  ```ts
  console.log(await ns.replicant.counter.get()); // Returns read-only value

  await ns.replicant.counter.set(1);

  await ns.replicant.counter.update((value) => value + 1);
  ```

- ✅ Replicant is reactive: subscribe to listen to changes

  ```ts
  const unsubscribe = await ns.replicant.counter.subscribe((newValue) => {
    console.log("Counter updated:", newValue);
  });

  // later, when you want to stop listening
  unsubscribe();
  ```

- 🚧 Replicant supports transactions: batch multiple updates for consistency

  ```ts
  await ns.transaction(() => {
    ns.replicant.counter.update((value) => value + 1);
    ns.replicant.games.update((value) => [...value, "New Game"]);
  });
  ```

- 🚧 Replicant supports migrations: when a schema changes, migrate without data loss

  ```ts
  const newManifest = defineNamespace("match", {
    replicant: {
      counter: { schema },
      games: {
        schema,
        migration: [
          {
            oldSchema,
            migrate: (oldValue) => oldValue.map((game) => /* ... */ game),
          },
        ],
      },
    },
  });
  ```

- ✅ Replicant supports access control: roles declare default capabilities; per-field `allow`/`deny` refine them

  ```ts
  const manifest = defineNamespace("match", {
    roles: {
      judge: { permission: ["replicant-read", "replicant-write"] },
      viewer: { permission: ["replicant-read"] },
    },
    replicant: {
      counter: { schema, permission: { read: { deny: ["viewer"] } } },
      games: { schema, permission: { write: { allow: [] } } }, // server-owned
    },
  });
  ```

- ✅ Replicant supports computed values derived from other replicants or computed fields: the manifest declares the schema, the compute function is provided on the server at load

  ```ts
  // Manifest: declare schema only
  const manifest = defineNamespace("match", {
    replicant: { counter: { schema }, games: { schema } },
    computed: { firstGameId: { schema }, summary: { schema } },
  });

  // Server: provide the compute functions
  const match = implementNamespace(manifest, {
    seedReplicant: { counter: () => 0, games: () => [] },
    implementComputed: {
      firstGameId: (ctx) => ctx.replicant.games.get()[0]?.id ?? null,
      summary: (ctx) => `first: ${ctx.computed.firstGameId.get()}`,
    },
  });
  loadNamespace(match);

  // Client: read-only
  const ns = await loadNamespace(manifest);
  await ns.computed.firstGameId.subscribe((firstGameId) => {
    console.log("First game updated:", firstGameId);
  });
  ```

- ✅ Clients can derive values locally over live fields: recomputed in the browser on every server push with no round-trip

  ```ts
  import { derive, loadNamespace } from "@nodecg/client";

  const match = await loadNamespace(manifest);
  const leader = derive((get) =>
    get(match.replicant.scoreLeft) > get(match.replicant.scoreRight)
      ? "left"
      : "right",
  );
  leader.subscribe((value) => console.log("leader:", value));
  ```

- ✅ Replicant is grouped into namespaces to avoid name conflicts and scope permissions

  ```ts
  const commercialManifest = defineNamespace("commercial", {
    roles: { producer: { permission: ["replicant-read", "replicant-write"] } },
    replicant: {
      isRunning: { schema, permission: { write: { allow: ["producer"] } } },
      remainingTime: { schema },
    },
  });
  ```

- ✅ A namespace can run server-side logic when it loads, and can read its children inside

  ```ts
  const overlay = implementNamespace(overlayManifest, {
    children: { commercial },
    onLoad: async (ctx) => {
      const { isRunning } = ctx.children.commercial.replicant;
      await ctx.topic.status.publish(isRunning.get() ? "On break" : "Live");
    },
  });

  const show = implementNamespace(showManifest, {
    children: { overlay },
  });

  loadNamespace(show);
  ```

- ✅ Replicant in client-side is synchronized on reconnect

- 🚧 Admin dashboard (view, clear, export, import, freeze)
- 🚧 boolean option for persistence
- 🚧 Hooks: `beforeUpdate`, `afterUpdate`
- 🚧 Revision number
- 🚧 Conflict resolution with custom logic
- 🚧 Subscription update frequency control
- 🚧 Replicant update audit log (user, timestamp, label)
- 🚧 List of subscribers with user, session, connection
- 🚧 Built-in stopwatch/timer logic, scheduled updates
- 🚧 Soft-delete removed replicant definitions
- 🚧 External webhook registration for replicant updates
- 🚧 Cross instance replicant sharing

#### Replicant Schema

- ✅ Effect Schema
- ✅ Standard Schema v1 (Zod, Valibot, etc)
- ✅ JSON Schema

### Messaging

- ✅ Topics fan out message with no reply

  ```ts
  const manifest = defineNamespace("chat", {
    topic: {
      message: {
        schema: Schema.String,
        permission: {
          read: { everyone: "allow" },
          write: { everyone: "allow" },
        },
      },
    },
  });

  const ns = await loadNamespace(manifest);
  await ns.topic.message.publish("Hello, world!");
  const cancel = await ns.topic.message.subscribe((message) => {
    console.log("Received:", message);
  });
  ```

- ✅ RPC is a 1:1 addressed call with a reply

  ```ts
  const manifest = defineNamespace("dice", {
    replicant: { lastRoll: { schema: Schema.Number } },
    rpc: {
      roll: {
        schema: { request: Schema.Number, response: Schema.Number },
        permission: { write: { everyone: "allow" } },
      },
    },
  });

  // Server: provide the handler. `ctx` reads and writes replicants and publishes topics
  const dice = implementNamespace(manifest, {
    seedReplicant: { lastRoll: () => 0 },
    implementRpc: {
      roll: async (max, ctx) => {
        const rolled = 1 + Math.floor(Math.random() * max);
        await ctx.replicant.lastRoll.set(rolled);
        return rolled;
      },
    },
  });
  loadNamespace(dice);

  // Client: call and await the reply
  const ns = await loadNamespace(manifest);
  const rolled = await ns.rpc.roll.call(6);
  ```

- 🚧 Per-RPC typed error schema (`{ request, response, error }`)

### 🚧 Data

For datasets too large to keep in memory. Unlike Replicant, which is mirrored in memory and read synchronously, Data is read and written asynchronously, straight from the store, and never kept in-memory permanently.

### Data Persistence

- ✅ Data persistence is abstracted and can be implemented for any storage backend
- ✅ Default data persistence is SQLite for system data, and JSON files for Replicant

### Authentication

- ✅ User login via pluggable OAuth/OIDC providers with session cookies
- ✅ External integrations authenticate with API keys
- 🚧 OAuth client-credentials token exchange for integrations

### Authorization

- ✅ Per-field permission enforcement at every transport from the baked role/principal rules
- ✅ Role reporting: `me()` returns the caller's held roles per namespace. Per-field access is evaluated client-side from the shared manifest's baked rules
- ✅ Role assignment: admins grant and revoke roles, and export or import every assignment as one document

### ✅ Frontend serving

- Each namespace serves its own frontend files from the same origin under `/frontend/namespaces/{ns}/`
  - built static directory in production
  - optionally Vite dev server (HMR) for development

### ✅ Custom routes

- A namespace can declare custom HTTP routes, served under `/namespaces/{namespace}/custom/{name}/`
  ```ts
  const scoreboard = defineNamespace("scoreboard", {
    customRoute: {
      webhook: { post: { permission: { write: { everyone: "allow" } } } },
    },
  });

  implementNamespace(scoreboard, {
    implementCustomRoute: {
      webhook: { post: (request) => new Response("ok") },
    },
  });
  ```
- Libraries like srvx can be used to implement the routes with Express middlewares

### ✅ Server configuration

The server reads its settings from environment variables.

| Variable                        | Default                   | Sets                                                                          |
| ------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `NODECG_PORT`                   | `3000`                    | the port to listen on                                                         |
| `NODECG_BASE_URL`               | `http://localhost:{port}` | the public URL of the server                                                  |
| `NODECG_DATA_DIR`               | `data`                    | the folder persisted data is written to                                       |
| `NODECG_DEV`                    | `false`                   | development mode                                                              |
| `NODECG_REQUIRE_AUTH`           | `false`                   | refuse anonymous requests                                                     |
| `NODECG_SESSION_TTL`            | `7 days`                  | how long a login session lasts                                                |
| `NODECG_SESSION_RENEW_INTERVAL` | `1 day`                   | how often a session in use is renewed                                         |
| `NODECG_LOGIN_ATTEMPT_TTL`      | `10 minutes`              | how long a started login stays valid                                          |
| `NODECG_SUPERADMINS`            | none                      | superadmins, as comma-separated `provider:subject` pairs                      |
| `NODECG_SUPERADMIN_CLAIM_TOKEN` | none                      | a secret of 16 characters or more that lets a logged-in user claim superadmin |

### 🚧 Asset storage

- Operator-managed media (images/videos/audio): upload/list/delete with a reactive metadata index that graphics subscribe to

### 🚧 Outdated Client Detection

## Development

- Install: `pnpm install`
- Type check: `pnpm type-check`
- Effect diagnostics: `pnpm effect-check`
- Test: `pnpm vitest`
- Lint: `pnpm oxlint`
- Format: `pnpm oxfmt`

#### Effect diagnostics in VS Code

1. Get the path to binary for the Effect LSP
   ```sh
   dirname $(pnpm exec effect-tsgo get-exe-path)
   ```
1. Configure VS Code to use the LSP
   ```jsonc
   {
     "js/ts.experimental.useTsgo": true,
     "js/ts.tsdk.path": "<relative path to LSP folder>",
   }
   ```

### Architecture

NodeCG is a full-stack framework where there are server-side code, client-side code, and small runtime code and types used in both environment. In order to have clear separation, this repository uses monorepo with pnpm.

- Server-side package: vitest runs on Node.js environment. Can use APIs from `node:*` imports. Cannot use browser APIs (window, document, etc)
- Client-side package: vitest runs browser mode and runs tests in real browsers. Can use browser APIs, but cannot use `node:*` imports.
- Package for both: vitest runs both on Node.js environment and browser mode. Cannot import `node:*` and cannot use browser APIs.

The codebase uses Effect for type-safety, error-safety, and dependency injection.

- Entire codebase runs as Effect, except user-facing functions that provides both Effect-based interface and non-Effect interface. The boundary is at the very edge to keep the advantages of Effect.

## License

MIT License
