# SSE/Streaming Architecture

## Event Flow Architecture

The OpenCode client uses a **single global SSE connection** plus standard HTTP REST API calls:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                      │
├─────────────────────────────────────────────────────────────┤
│  GlobalSDKProvider                                        │
│    │                                                     │
│    ├── Single SSE connection to `/global/event`             │
│    │    - Streams all events from all directories          │
│    │    - Uses AsyncGenerator for iteration                │
│    │    - Auto-reconnects with exponential backoff         │
│    │                                                     │
│    └── createGlobalEmitter()                              │
│         - Routes events to directory-specific emitters       │
│         - Emitter key = "global" or directory name        │
│                                                          │
│  SDKProvider (per directory)                              │
│    │                                                     │
│    ├── Listens to directory emitter                        │
│    │    globalSDK.event.on(directory, callback)            │
│    │                                                     │
│    └── Emits typed events                                │
│         emitter.emit(event.type, event)                     │
│                                                          │
│  GlobalSyncProvider                                       │
│    │                                                     │
│    ├── Listens to all emitters                            │
│    │    globalSDK.event.listen((e) => {...})             │
│    │                                                     │
│    └── Updates SolidJS stores reactively                   │
│         setStore("message", ...)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SSE (events.stream)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Server                         │
├─────────────────────────────────────────────────────────────┤
│  POST /session/{id}/message  →  Create & stream response  │
│  GET  /global/event           →  SSE events stream          │
│  GET  /pty/{id}/connect     →  WebSocket for terminal     │
└─────────────────────────────────────────────────────────────┘
```

## SSE Event Types

**Global Events** (`GlobalEvent`):

```typescript
{
  directory: string // "global" or project directory
  payload: Event // Union of all event types
}
```

**Event Types Streamed**:

- `session.created`, `session.updated`, `session.deleted`
- `session.diff` - File changes in session
- `message.updated`, `message.removed`
- `message.part.updated`, `message.part.removed`
- `permission.asked`, `permission.replied`
- `lsp.updated` - Language server status
- `vcs.branch.updated` - Git branch changes
- `mcp.tools_changed` - MCP tool updates
- `session.status`, `session.error`
- `todo.updated`
- `pty.created`, `pty.updated`, `pty.exited`, `pty.deleted`
- `global.disposed` - Server reboot required
- And more...

## Client-Side Event Handling

### GlobalSDK Context (`packages/app/src/context/global-sdk.tsx`)

```typescript
// 1. Create SSE client with long-lived connection
const eventSdk = createOpencodeClient({ baseUrl: server.url })

// 2. Subscribe to global events stream
const events = await eventSdk.global.event()

// 3. Iterate through stream
for await (const event of events.stream) {
  // Route to directory-specific emitter
  emitter.emit(event.directory ?? 'global', event.payload)
}
```

### SDK Context (`packages/app/src/context/sdk.tsx`)

```typescript
// Listen only to events for this directory
globalSDK.event.on(props.directory, async (event) => {
  // Emit typed event to local emitter
  emitter.emit(event.type, event)
})
```

### GlobalSync Context (`packages/app/src/context/global-sync.tsx`)

```typescript
globalSDK.event.listen((e) => {
  const directory = e.name
  const event = e.details

  // Route to directory store
  switch (event.type) {
    case 'message.updated':
      // Binary search + reconcile for efficient updates
      setStore('message', sessionID, reconcile(event.properties.info))
      break
    case 'message.part.updated':
      setStore('part', messageID, reconcile(part))
      break
    // ... handle 20+ event types
  }
})
```

## Key Implementation Details

### 1. SSE Client (`packages/sdk/js/src/v2/gen/core/serverSentEvents.gen.ts`)

- Auto-reconnect with exponential backoff (3s → 30s cap)
- Tracks `Last-Event-ID` for resume
- Parses SSE format (`data:`, `event:`, `id:`, `retry:`)
- JSON validation & transformation
- Abort signal support

```typescript
const createSseClient = ({
  url,
  signal,
  onSseError,
  onSseEvent,
  sseDefaultRetryDelay = 3000,
  sseMaxRetryDelay = 30000,
}: ServerSentEventsOptions) => {
  const createStream = async function* () {
    while (true) {
      try {
        const response = await fetch(url, { signal })
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          // Parse SSE lines and yield events
          yield parseSSE(value)
        }
      } catch (error) {
        onSseError?.(error)
        // Exponential backoff retry
        await sleep(Math.min(retryDelay * 2 ** (attempt - 1), maxDelay))
      }
    }
  }
  return { stream: createStream() }
}
```

### 2. Optimistic Updates

```typescript
session.addOptimisticMessage({ sessionID, messageID, parts, agent, model })
// UI updates immediately, real event confirms later
```

### 3. Binary Search + Reconcile

- Sorted arrays for O(log n) lookups
- `solid-js/store` reconcile for minimal re-renders
- Key-based updates for efficient diffs

```typescript
const result = Binary.search(messages, messageID, (m) => m.id)
if (result.found) {
  setStore('message', sessionID, result.index, reconcile(newMessage))
}
```

### 4. State Synchronization

- Per-project stores via `globalSync.child(directory)`
- Centralized error handling
- Event-driven updates, no polling

## WebSocket for Terminal

Separate from SSE, PTY uses WebSocket:

```typescript
// packages/app/src/component/terminal.tsx
const url = `${baseUrl}/pty/${ptyID}/connect`
const ws = new WebSocket(url)
// Bidirectional terminal I/O
```

## HTTP API Usage

Standard REST for:

- Creating sessions: `POST /session`
- Sending prompts: `POST /session/{id}/message`
- File operations: `GET /file/content`, `GET /file`
- Providers: `GET /provider`, `POST /provider/{id}/oauth/authorize`
- Config: `GET /config`, `PATCH /config`

## For New Web UI

### Required Components

#### 1. SSE Connection Manager

```typescript
class SSEManager {
  private eventSource: EventSource
  private emitter: EventEmitter

  connect(url: string) {
    this.eventSource = new EventSource(url)
    this.eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data)
      this.emitter.emit(data.directory, data.payload)
    }
  }
}
```

#### 2. Event Router

```typescript
function routeEvent(directory: string, event: Event) {
  switch (event.type) {
    case 'message.updated':
      handleMessageUpdate(event)
      break
    case 'message.part.updated':
      handlePartUpdate(event)
      break
    case 'session.diff':
      handleSessionDiff(event)
      break
    case 'permission.asked':
      handlePermissionRequest(event)
      break
    case 'lsp.updated':
      handleLspUpdate(event)
      break
    case 'vcs.branch.updated':
      handleVcsUpdate(event)
      break
    // ... handle all 30+ event types
  }
}
```

#### 3. State Store

```typescript
const store = {
  sessions: [],
  messages: { [sessionID]: Message[] },
  parts: { [messageID]: Part[] },
  sessionStatus: { [sessionID]: SessionStatus },
  sessionDiffs: { [sessionID]: FileDiff[] },
  todos: { [sessionID]: Todo[] },
  permissions: { [sessionID]: PermissionRequest[] },
  mcpStatus: { [name: string]: McpStatus },
  lspStatus: LspStatus[],
  vcs: VcsInfo,
  // ... reactive updates on events
}
```

### Key Takeaways

- **Single SSE connection** for all events (no per-resource connections)
- **Directory-based event routing** to separate concerns
- **Optimistic UI updates** + event confirmation pattern
- **Sorted arrays + binary search** for O(log n) performance
- **WebSocket only for terminal** (real-time bidirectional required)
- **No polling** - fully event-driven architecture
- **Exponential backoff** for resilient SSE reconnection
- **Event type discrimination** using tagged union types
