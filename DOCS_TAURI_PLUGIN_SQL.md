Title: SQL

URL Source: https://v2.tauri.app/plugin/sql/

Markdown Content:
Plugin providing an interface for the frontend to communicate with SQL databases through [sqlx](https://github.com/launchbadge/sqlx). It supports the SQLite, MySQL and PostgreSQL drivers, enabled by a Cargo feature.

_This plugin requires a Rust version of at least **1.77.2**_

| Platform | Level | Notes |
| --- | --- | --- |
| windows |  |  |
| linux |  |  |
| macos |  |  |
| android |  |  |
| ios |  |  |

Install the SQL plugin to get started.

*   [Automatic](https://v2.tauri.app/plugin/sql/#tab-panel-1130)
*   [Manual](https://v2.tauri.app/plugin/sql/#tab-panel-1131)

Use your project’s package manager to add the dependency:

*   [npm](https://v2.tauri.app/plugin/sql/#tab-panel-1119)
*   [yarn](https://v2.tauri.app/plugin/sql/#tab-panel-1120)
*   [pnpm](https://v2.tauri.app/plugin/sql/#tab-panel-1121)
*   [deno](https://v2.tauri.app/plugin/sql/#tab-panel-1122)
*   [bun](https://v2.tauri.app/plugin/sql/#tab-panel-1123)
*   [cargo](https://v2.tauri.app/plugin/sql/#tab-panel-1124)

`npm run tauri add sql`

After installing the plugin, you must select the supported database engine. The available engines are Sqlite, MySQL and PostgreSQL. Run the following command in the `src-tauri` folder to enable your preferred engine:

*   [SQLite](https://v2.tauri.app/plugin/sql/#tab-panel-1110)
*   [MySQL](https://v2.tauri.app/plugin/sql/#tab-panel-1111)
*   [PostgreSQL](https://v2.tauri.app/plugin/sql/#tab-panel-1112)

`cargo add tauri-plugin-sql --features sqlite`

All the plugin’s APIs are available through the JavaScript guest bindings:

*   [SQLite](https://v2.tauri.app/plugin/sql/#tab-panel-1113)
*   [MySQL](https://v2.tauri.app/plugin/sql/#tab-panel-1114)
*   [PostgreSQL](https://v2.tauri.app/plugin/sql/#tab-panel-1115)

The path is relative to [`tauri::api::path::BaseDirectory::AppConfig`](https://docs.rs/tauri/2.0.0/tauri/path/enum.BaseDirectory.html#variant.AppConfig).

`import Database from '@tauri-apps/plugin-sql';// when using `"withGlobalTauri": true`, you may use// const Database = window.__TAURI__.sql;const db = await Database.load('sqlite:test.db');await db.execute('INSERT INTO ...');`

We use [sqlx](https://docs.rs/sqlx/latest/sqlx/) as the underlying library and adopt their query syntax.

*   [SQLite](https://v2.tauri.app/plugin/sql/#tab-panel-1116)
*   [MySQL](https://v2.tauri.app/plugin/sql/#tab-panel-1117)
*   [PostgreSQL](https://v2.tauri.app/plugin/sql/#tab-panel-1118)

Use the ”$#” syntax when substituting query data

`const result = await db.execute(  "INSERT into todos (id, title, status) VALUES ($1, $2, $3)",  [todos.id, todos.title, todos.status],);const result = await db.execute("UPDATE todos SET title = $1, status = $2 WHERE id = $3",[todos.title, todos.status, todos.id],);`

This plugin supports database migrations, allowing you to manage database schema evolution over time.

Migrations are defined in Rust using the [`Migration`](https://docs.rs/tauri-plugin-sql/latest/tauri_plugin_sql/struct.Migration.html) struct. Each migration should include a unique version number, a description, the SQL to be executed, and the type of migration (Up or Down).

Example of a migration:

`use tauri_plugin_sql::{Migration, MigrationKind};let migration = Migration {    version: 1,    description: "create_initial_tables",    sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",    kind: MigrationKind::Up,};`

Or if you want to use SQL from a file, you can include it by using `include_str!`:

`use tauri_plugin_sql::{Migration, MigrationKind};let migration = Migration {    version: 1,    description: "create_initial_tables",    sql: include_str!("../drizzle/0000_graceful_boomer.sql"),    kind: MigrationKind::Up,};`

Migrations are registered with the [`Builder`](https://docs.rs/tauri-plugin-sql/latest/tauri_plugin_sql/struct.Builder.html) struct provided by the plugin. Use the `add_migrations` method to add your migrations to the plugin for a specific database connection.

Example of adding migrations:

`use tauri_plugin_sql::{Builder, Migration, MigrationKind};fn main() {    let migrations = vec![        // Define your migrations here        Migration {            version: 1,            description: "create_initial_tables",            sql: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);",            kind: MigrationKind::Up,        }    ];    tauri::Builder::default()        .plugin(            tauri_plugin_sql::Builder::default()                .add_migrations("sqlite:mydatabase.db", migrations)                .build(),        )        ...}`

To apply the migrations when the plugin is initialized, add the connection string to the `tauri.conf.json` file:

`{  "plugins": {    "sql": {      "preload": ["sqlite:mydatabase.db"]    }  }}`

Alternatively, the client side `load()` also runs the migrations for a given connection string:

`import Database from '@tauri-apps/plugin-sql';const db = await Database.load('sqlite:mydatabase.db');`

Ensure that the migrations are defined in the correct order and are safe to run multiple times.

*   **Version Control**: Each migration must have a unique version number. This is crucial for ensuring the migrations are applied in the correct order.
*   **Idempotency**: Write migrations in a way that they can be safely re-run without causing errors or unintended consequences.
*   **Testing**: Thoroughly test migrations to ensure they work as expected and do not compromise the integrity of your database.

By default all potentially dangerous plugin commands and scopes are blocked and cannot be accessed. You must modify the permissions in your `capabilities` configuration to enable these.

See the [Capabilities Overview](https://v2.tauri.app/security/capabilities/) for more information and the [step by step guide](https://v2.tauri.app/learn/security/using-plugin-permissions/) to use plugin permissions.

`{  "permissions": [    ...,    "sql:default",    "sql:allow-execute",  ]}`

[Default Permission](https://v2.tauri.app/plugin/sql/#default-permission)
-------------------------------------------------------------------------

### [Default Permissions](https://v2.tauri.app/plugin/sql/#default-permissions)

This permission set configures what kind of database operations are available from the sql plugin.

### Granted Permissions

All reading related operations are enabled. Also allows to load or close a connection.

#### This default permission set includes the following:

*   `allow-close`
*   `allow-load`
*   `allow-select`

Permission Table
----------------

| Identifier | Description |
| --- | --- |
| `sql:allow-close` | Enables the close command without any pre-configured scope. |
| `sql:deny-close` | Denies the close command without any pre-configured scope. |
| `sql:allow-execute` | Enables the execute command without any pre-configured scope. |
| `sql:deny-execute` | Denies the execute command without any pre-configured scope. |
| `sql:allow-load` | Enables the load command without any pre-configured scope. |
| `sql:deny-load` | Denies the load command without any pre-configured scope. |
| `sql:allow-select` | Enables the select command without any pre-configured scope. |
| `sql:deny-select` | Denies the select command without any pre-configured scope. |

* * *

© 2025 Tauri Contributors. CC-BY / MIT
