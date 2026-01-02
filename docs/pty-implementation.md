# PTY Implementation Details

The PTY (Pseudoterminal) implementation in `@opencode-ai/app` is a modern, performance-oriented system that bridges a WebAssembly-based frontend with a native Bun backend.

## Tech Stack & Libraries

- **Frontend Engine:** `ghostty-web` (v0.3.0). A high-performance terminal emulator compiled to WebAssembly, providing native-like rendering speeds.
- **Frontend Framework:** **SolidJS**. State is managed using Solid stores and contexts.
- **Backend Runtime:** **Bun**. Utilizes `bun-pty` for native OS bindings to spawn and manage PTY processes.
- **Communication:**
  - **Hono**: Powers the API and WebSocket server.
  - **WebSocket**: Used for bidirectional, low-latency streaming of terminal I/O.
- **Addons:**
  - `FitAddon`: Handles responsive terminal resizing.
  - `SerializeAddon`: A custom port of xterm.js's serialization logic to `ghostty-web`, used for state persistence.

## Topology

1.  **UI Layer (Browser):** SolidJS components (`terminal.tsx`) manage the terminal lifecycle and tabs.
2.  **Terminal Layer (WASM):** `ghostty-web` runs in the browser, handling keyboard input and ANSI rendering.
3.  **Transport Layer (WebSocket):** A dedicated WebSocket connection at `/pty/${ptyId}/connect` streams raw data between the browser and the server.
4.  **Process Layer (Backend):** The Bun server spawns native shell processes (e.g., `zsh`, `bash`) and pipes their I/O directly to the WebSocket.
5.  **Persistence Layer:** When a terminal tab is closed or the app is refreshed, the `SerializeAddon` captures the current buffer as a string of ANSI sequences, which is saved to LocalStorage via the `TerminalProvider` context.

## Key APIs

### Frontend Context (`useTerminal`)

- `new()`: Spawns a new PTY session via the SDK and adds it to the local store.
- `close(id)`: Terminates the remote PTY process and removes local state.
- `update(pty)`: Synchronizes terminal metadata (title, dimensions) with the backend.

### Backend SDK (`@opencode-ai/sdk`)

- `pty.create({ title })`: POST request to initialize a new process.
- `pty.update({ ptyID, size })`: PATCH request to resize the PTY.
- `pty.remove({ ptyID })`: DELETE request to kill the process.

### Real-time Data

- `term.onData(data => ws.send(data))`: Sends user input to the backend.
- `ws.onmessage = (e) => term.write(e.data)`: Writes backend output to the WASM engine.
