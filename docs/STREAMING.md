# Streaming & Real-time Updates Architecture

This document describes how Real-time/SSE streaming works between the OpenCode server and client. This architecture is critical for the chat interface, file synchronization, and session management.

## Architecture Overview

The system uses a unidirectional data flow for real-time updates:

1.  **Action**: User performs an action (e.g., sends a message via POST request).
2.  **Processing**: Server processes the request (e.g., AI generates tokens).
3.  **Event Emission**: Server components emit events to the `GlobalBus`.
4.  **Distribution**: The `GlobalBus` forwards these events to the `/global/event` SSE stream.
5.  **Consumption**: The client receives SSE events and updates its local state store.

## Server-Side Implementation

### SSE Endpoint: `/global/event`

The server exposes a single global event stream endpoint at `/global/event`.

- **Implementation**: `packages/opencode/src/server/server.ts`
- **Format**: `text/event-stream`
- **Behavior**:
  - On connection, sends a `server.connected` event.
  - Subscribes to the internal `GlobalBus` to forward all system events.
  - Sends a heartbeat (`server.heartbeat`) every 30 seconds to prevent timeouts.

### Event Bus: `GlobalBus`

The `GlobalBus` (`packages/opencode/src/bus/global.ts`) is the central hub for all real-time events. It is an `EventEmitter` that broadcasts a unified payload structure:

```typescript
{
  directory: string; // The project directory or "global"
  payload: {
    type: string;    // Event type (e.g., "message.part.updated")
    properties: any; // Event data
  }
}
```

### Key Events

#### Session & Chat Events

These events are crucial for the streaming chat interface:

- **`message.updated`**: Emitted when a message's status or metadata changes.
- **`message.part.updated`**: Emitted for **streaming tokens**. This is the most frequent event during AI generation.
  - Payload includes the `part` object with the updated `text` or `state`.
  - Client uses this to show typing effects.
- **`message.part.removed`**: Emitted when a message part is deleted.
- **`session.updated`**: Emitted when session metadata (title, updated time) changes.
- **`session.status`**: Emitted to indicate if a session is `busy` or `idle`.

#### File & Project Events

- **`project.updated`**: Project metadata changes.
- **`session.diff`**: Emitted when file changes occur within a session.
- **`todo.updated`**: Emitted when the todo list changes.
- **`permission.asked`**: Emitted when the AI needs user permission to run a tool.

## Client-Side Implementation

### SDK Connection

The client connects using the SDK's `createOpencodeClient`. The SDK handles the low-level SSE connection, reconnection logic, and parsing.

- **File**: `packages/sdk/js/src/v2/gen/core/serverSentEvents.gen.ts` (generated) & `packages/sdk/js/src/v2/client.ts`
- **Mechanism**: Uses `fetch` with `TextDecoderStream` to read the stream.
- **Automatic Reconnection**: Exponential backoff is built-in.

### State Management (Global Sync)

The React/Solid application uses a **Global Sync** pattern to mirror the server state.

- **File**: `packages/app/src/context/global-sync.tsx`
- **Store Structure**:
  - **Global Store**: Holds list of projects, providers, configuration.
  - **Project Stores** (`children`): Separated by directory. Each contains sessions, messages, file statuses, etc., for that specific project.
- **Reconciliation**: The client uses granular reconciliation (e.g., SolidJS `reconcile`) to update only the changed parts of the store. This ensures high performance even with frequent token updates.

### Handling Streaming Updates (Code Example)

When implementing a new UI, you should listen to the SDK events and update your local state. Do not rely on the HTTP response of the POST request for the full data; rely on the stream.

```typescript
// 1. Initialize Client
const sdk = createOpencodeClient({ baseUrl: "http://localhost:4096" });

// 2. Listen to Events
sdk.event.listen((event) => {
  const { name: directory, details } = event;

  if (details.type === "message.part.updated") {
    const { part } = details.properties;

    // 3. Update Local State
    // Find the message and part in your store and update the text/content
    updateLocalStore(part.messageID, part.id, part);
  }
});

// 4. Send Prompt (Fire and Forget)
// The response will stream in via the event listener above
await sdk.session.prompt({
  sessionID: "ses_123",
  parts: [{ type: "text", text: "Hello world" }]
});
```

## Best Practices for UI Implementation

1.  **Optimistic Updates**: For user messages, display them immediately before the server acknowledges them.
2.  **Granular Updates**: Only re-render the specific message part that is updating. Avoid re-rendering the entire message list on every token.
3.  **Handling "Busy" State**: Listen to `session.status` events to disable input while the AI is generating.
4.  **Permissions**: Listen for `permission.asked` events to show a modal/toast for user approval.
5.  **Reconnection**: The UI should handle connection drops gracefully (the SDK handles the logic, but the UI should show a "Reconnecting..." state if `server.connected` isn't received for a while or if requests fail).
