# Drizzle + Effect Guide

Complete guide for using Drizzle ORM with Effect ecosystem.

## Installation

```bash
# Core packages
npm install effect @effect/sql @effect/sql-pg @effect/sql-drizzle

# Drizzle
npm install drizzle-orm
npm install -D drizzle-kit

# Database driver (PostgreSQL)
npm install pg
npm install -D @types/pg
```

## 1. Define Schema (Drizzle)

```typescript
// src/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Infer types from Drizzle
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
```

## 2. Configure Drizzle Kit

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "mydb",
  },
});
```

## 3. Setup Effect Layers

```typescript
// src/db.ts
import { Effect, Layer, Console, Config } from "effect";
import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// PostgreSQL connection layer
export const PgLive = PgClient.layer({
  host: Config.string("DB_HOST").pipe(Config.withDefault("localhost")),
  port: Config.number("DB_PORT").pipe(Config.withDefault(5432)),
  database: Config.string("DB_NAME").pipe(Config.withDefault("mydb")),
  username: Config.string("DB_USER").pipe(Config.withDefault("postgres")),
  password: Config.secret("DB_PASSWORD"),
  maxConnections: 10,
});

// Drizzle layer (uses PgClient's connection pool)
export const DrizzleLive = PgDrizzle.layer.pipe(Layer.provide(PgLive));

// Combined database layer
export const DbLive = Layer.mergeAll(PgLive, DrizzleLive);

// Migration function (to be run at startup)
export const runMigrations = Effect.fn("runMigrations")(function* () {
  yield* Console.log("Running database migrations...");

  const drizzle = yield* PgDrizzle.PgDrizzle;

  yield* Effect.tryPromise({
    try: () => migrate(drizzle, { migrationsFolder: "./drizzle" }),
    catch: (error) => new Error(`Migration failed: ${error}`),
  });

  yield* Console.log("✓ Migrations completed");
});
```

## 4. Generate and Run Migrations

```bash
# 1. Modify schema in src/schema.ts
# 2. Generate migrations
npx drizzle-kit generate

# 3. Migrations will be auto-applied at startup (see example below)

# Optional: View database in Drizzle Studio
npx drizzle-kit studio
```

## 5. Basic Queries (Type-Safe)

```typescript
// src/repositories/users.ts
import { Effect } from "effect";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { eq, like, and, desc } from "drizzle-orm";
import { users, type User, type InsertUser } from "../schema";

// Get all users
export const getAllUsers = Effect.fn("getAllUsers")(function* () {
  const drizzle = yield* PgDrizzle.PgDrizzle;
  return yield* drizzle.select().from(users);
});

// Get user by ID
export const getUserById = (id: number) =>
  Effect.fn("getUserById")(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;
    const result = yield* drizzle
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0]; // Type: User | undefined
  });

// Create user
export const createUser = (data: InsertUser) =>
  Effect.fn("createUser")(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;
    const [user] = yield* drizzle.insert(users).values(data).returning();
    return user; // Type: User
  });

// Update user
export const updateUser = (id: number, data: Partial<InsertUser>) =>
  Effect.fn("updateUser")(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;
    const [user] = yield* drizzle
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user; // Type: User
  });

// Delete user
export const deleteUser = (id: number) =>
  Effect.fn("deleteUser")(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;
    yield* drizzle.delete(users).where(eq(users.id, id));
  });

// Search with filters
export const searchUsers = (searchTerm: string) =>
  Effect.fn("searchUsers")(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;
    return yield* drizzle
      .select()
      .from(users)
      .where(like(users.name, `%${searchTerm}%`))
      .orderBy(desc(users.createdAt))
      .limit(10);
  });
```

## 6. Joins and Relations

```typescript
// src/repositories/posts.ts
import { Effect } from "effect";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { eq } from "drizzle-orm";
import { posts, users } from "../schema";

// Get posts with author info
export const getPostsWithAuthors = Effect.fn("getPostsWithAuthors")(
  function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;

    return yield* drizzle
      .select({
        post: posts,
        author: users,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id));
    // Type: { post: Post, author: User | null }[]
  },
);

// Get user with their posts
export const getUserWithPosts = (userId: number) =>
  Effect.fn("getUserWithPosts")(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;

    const [user] = yield* drizzle
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return null;

    const userPosts = yield* drizzle
      .select()
      .from(posts)
      .where(eq(posts.authorId, userId));

    return { ...user, posts: userPosts };
  });
```

## 7. Transactions

```typescript
// src/repositories/transactions.ts
import { Effect } from "effect";
import * as PgDrizzle from "@effect/sql-drizzle/Pg";
import { users, posts, type InsertUser, type InsertPost } from "../schema";

export const createUserAndPost = (
  userData: InsertUser,
  postData: Omit<InsertPost, "authorId">,
) =>
  Effect.fn("createUserAndPost")(function* () {
    const drizzle = yield* PgDrizzle.PgDrizzle;

    // Everything inside transaction is atomic
    return yield* drizzle.transaction((tx) =>
      Effect.fn("transaction")(function* () {
        // Create user
        const [user] = yield* tx.insert(users).values(userData).returning();

        // Create post with new user's ID
        const [post] = yield* tx
          .insert(posts)
          .values({ ...postData, authorId: user.id })
          .returning();

        return { user, post };
      }),
    );
  });
```

## 8. Complete Application Example

```typescript
// src/index.ts
import { Effect, Console } from "effect";
import { DbLive, runMigrations } from "./db";
import { createUser, getUserById, getAllUsers } from "./repositories/users";

const program = Effect.fn("main")(function* () {
  // 1. Run migrations at startup
  yield* runMigrations;

  yield* Console.log("Application started!");

  // 2. Create a user
  const user = yield* createUser({
    name: "Alice",
    email: "alice@example.com",
  });

  yield* Console.log("Created user:", user);

  // 3. Get user by ID
  const fetchedUser = yield* getUserById(user.id);
  yield* Console.log("Fetched user:", fetchedUser);

  // 4. Get all users
  const allUsers = yield* getAllUsers;
  yield* Console.log("All users:", allUsers);

  return "Done!";
});

// Run with database layer
Effect.runPromise(program.pipe(Effect.provide(DbLive)))
  .then(console.log)
  .catch(console.error);
```

## 9. Optional: Effect Schema Validation

Add runtime validation on top of compile-time safety:

```typescript
// src/schemas/user-schema.ts
import { Schema } from "effect";
import { type InsertUser } from "../schema";

export const InsertUserSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
  email: Schema.String.pipe(
    Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    Schema.maxLength(255),
  ),
  createdAt: Schema.optional(Schema.Date),
});

// Use in API endpoints
export const createUserSafe = (data: unknown) =>
  Effect.fn("createUserSafe")(function* () {
    // Validate input at runtime
    const validated = yield* Schema.decodeUnknown(InsertUserSchema)(data);

    // Create with validated data
    return yield* createUser(validated);
  });
```

## Key Points

1. **Schema**: Define in Drizzle → compile-time type safety
2. **Migrations**: Use `drizzle-kit generate` → run at startup with Effect
3. **Queries**: Drizzle query builder → fully typed
4. **Integration**: `@effect/sql-drizzle` uses same connection pool
5. **Effect.fn**: Always use for debugging/tracing
6. **Transactions**: Use Drizzle's `.transaction()` for atomic operations
7. **Single Instance**: Running migrations at startup is safe and simple

## Benefits

✅ **Type Safety**: Drizzle provides compile-time guarantees  
✅ **Auto Migrations**: Drizzle Kit generates migrations from schema  
✅ **Effect Ecosystem**: Full DI, error handling, and observability  
✅ **Single Pool**: One connection pool shared between migrations and queries  
✅ **Clean Architecture**: Separation of concerns with repositories  
✅ **Runtime Validation**: Optional Effect Schema for extra safety
