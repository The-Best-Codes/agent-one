# Cross-Window Sync Engine

A composable, event-based sync engine for AgentOne that enables effortless synchronization of state across multiple windows and tabs.

## Architecture Overview

The sync engine uses Tauri's global event system to broadcast state changes across all running instances. It implements a conflict-free synchronization strategy using causal version ordering with timestamp-based tiebreaking.

### Key Components

- **SyncEngine** (`core/sync-engine.ts`): Core event dispatcher using Tauri's global events
- **ConflictResolver** (`core/conflict-resolver.ts`): Handles version tracking and conflict resolution
- **Adapters** (`adapters/`): Composable wrappers around state management contexts
- **Hooks** (`hooks/`): React integration for easy adoption

## Usage

### Basic Setup

1. Initialize the sync engine (happens automatically on first use)
2. Create an adapter for your state
3. Use the React hook to set up synchronization

### Example: Syncing Chat Messages

```typescript
import { useSyncAdapter, emitSyncMessage } from "@/lib/sync";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";

function ChatComponent() {
  const persistence = usePersistence();

  useSyncAdapter(
    {
      entityType: "chat",
      selector: () => ({
        chatId: "current-chat",
        messages: persistence.loadChat("current-chat"),
        title: "My Chat",
      }),
      onRemoteChange: async (payload) => {
        persistence.saveChat({
          chatId: payload.chatId,
          messages: payload.messages,
        });
      },
    },
    persistence,
  );

  const handleSendMessage = async (message: string) => {
    const newMessages = [...messages, { role: "user", content: message }];
    persistence.saveChat({ chatId: "current-chat", messages: newMessages });

    await emitSyncMessage("chat", "current-chat", {
      chatId: "current-chat",
      messages: newMessages,
      title: "My Chat",
    });
  };

  return /* JSX */;
}
```

## Conflict Resolution

The engine uses a Last-Write-Wins strategy by default:

1. **Version-based**: Higher versions always win
2. **Timestamp-based**: If versions are equal, newer timestamps win
3. **Window ID-based**: If timestamps are equal, window IDs are compared (lexicographic ordering)

You can also provide a custom resolver:

```typescript
conflictResolution: (incoming, local) => {
  if (incoming.messages.length > local.messages.length) {
    return incoming;
  }
  return local;
};
```

## API Reference

### SyncEngine

```typescript
getSyncEngine(): Promise<SyncEngine>
getSyncEngineSync(): SyncEngine

class SyncEngine {
  async initialize(): Promise<void>
  async emit<T>(entityType, entityId, payload, operation?): Promise<void>
  on<T>(entityType, callback): () => void
  destroy(): void
}
```

### ConflictResolver

```typescript
class ConflictResolver {
  static shouldAccept(context): boolean;
  static resolve<T>(incoming, local, strategy): T;
  static getWindowId(): string;
  static getLocalVersion(entityType, entityId, defaultVersion): number;
  static setLocalVersion(entityType, entityId, version): void;
  static getLocalTimestamp(entityType, entityId, defaultTimestamp): number;
  static setLocalTimestamp(entityType, entityId, timestamp): void;
}
```

### React Hooks

#### useSyncAdapter

Sets up a sync adapter for a specific state context. No return value.

```typescript
useSyncAdapter<T, C>(
  config: SyncAdapterConfig<T, C>,
  context: C,
  enabled?: boolean
): void
```

#### useSyncListener

Listens to sync messages for a specific entity type.

```typescript
useSyncListener<T>(
  entityType: string,
  callback: (message: SyncMessage<T>) => void | Promise<void>,
  enabled?: boolean
): void
```

#### useSyncEmit

Returns a function to emit sync messages.

```typescript
useSyncEmit<T>(
  entityType: string,
  entityId: string
): (payload: T, operation?: "update" | "delete") => Promise<void>
```

## Version Tracking

Versions are stored in localStorage and persist across page reloads. Window IDs are stored in sessionStorage to ensure uniqueness per window but reset on page reload.

## Performance Considerations

- Events are broadcast to ALL windows, including the originating one
- Listeners should be idempotent (calling them multiple times should have the same effect)
- Version checking prevents data loss from concurrent edits
- Deep merging is available as an alternative conflict resolution strategy

## Troubleshooting

- **Changes not syncing**: Verify the sync adapter is enabled and the context is properly passed
- **Lost updates**: Check that custom conflict resolvers are correct
- **High memory usage**: Ensure listeners are properly unsubscribed (useEffect cleanup)
