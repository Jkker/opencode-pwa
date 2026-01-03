# Terminal Implementation

A full-featured terminal emulator for OpenCode PWA using Ghostty Web and React.

## Features

- ✅ **WebSocket Connection**: Real-time PTY communication via `/pty/{id}/connect`
- ✅ **Ghostty Integration**: Uses Ghostty Web terminal emulator (WASM-based)
- ✅ **Theme Support**: Colors adapt to app theme (light/dark)
- ✅ **Buffer Persistence**: Saves/restores terminal content and scroll position
- ✅ **Copy Support**: Cmd+C / Ctrl+Shift+C for copying selection
- ✅ **Custom Keybindings**: Handle special keys without browser interference
- ✅ **Resize Handling**: Tracks terminal dimensions and syncs to PTY
- ✅ **Serialize Addon**: Serializes terminal state for persistence
- ✅ **Fit Addon**: Auto-resize terminal to container

## Architecture

### Components

**Terminal Component** (`src/components/terminal.tsx`)

- Manages Ghostty Web terminal lifecycle
- Handles WebSocket connections
- Integrates with theme system
- Implements copy/paste functionality
- Custom keyboard event handling

**Terminal Store** (`src/stores/terminal-store.ts`)

- Zustand X store for terminal state management
- Tracks active terminals and their metadata
- Persists terminal state to localStorage
- Actions for CRUD operations on terminals

**Serialize Addon** (`src/lib/terminal/serialize-addon.ts`)

- Port of xterm.js serialize addon for Ghostty Web
- Serializes terminal buffer to ANSI escape sequences
- Enables buffer restoration on page reload
- Supports scrollback and cursor position

**Terminal Route** (`src/routes/terminal.tsx`)

- Test page for terminal functionality
- Tab management for multiple terminals
- Integration with OpenCode SDK

## Tech Stack

- **ghostty-web** v0.4.0 - WebAssembly terminal emulator
- **Zustand X** - State management with persistence
- **TanStack Router** - File-based routing
- **React 19** - UI framework with React Compiler

## Usage

### Development

1. Start OpenCode server:

```bash
opencode serve --cors localhost:5173
```

2. Start the React app:

```bash
pnpm dev
```

3. Navigate to `/terminal` to test the terminal

### Creating a Terminal

```tsx
import { Terminal } from '@/components/terminal'
import { terminalStore, type LocalPTY } from '@/stores/terminal-store'
import { useClient } from '@/lib/opencode/client'

function MyComponent() {
  const client = useClient()

  // Create a new PTY session
  const handleCreate = async () => {
    const response = await client.pty.create({
      title: 'My Terminal'
    })

    const pty: LocalPTY = {
      id: response.data.id,
      title: response.data.title
    }

    terminalStore.actions.addTerminal(pty)
    terminalStore.actions.setActiveTerminal(pty.id)
  }

  const terminal = terminalStore.actions.getActiveTerminal()

  return (
    <div>
      {terminal && (
        <Terminal
          pty={terminal}
          onCleanup={(pty) => {
            // Save terminal state on cleanup
            terminalStore.actions.updateTerminal(pty)
          }}
        />
      )}
    </div>
  )
}
```

### Store Actions

```tsx
// Add terminal
terminalStore.actions.addTerminal({ id: 'pty-1', title: 'Terminal 1' })

// Update terminal
terminalStore.actions.updateTerminal({
  id: 'pty-1',
  buffer: 'serialized content',
  rows: 24,
  cols: 80,
  scrollY: 0
})

// Remove terminal
terminalStore.actions.removeTerminal('pty-1')

// Set active terminal
terminalStore.actions.setActiveTerminal('pty-1')

// Get terminal by ID
const terminal = terminalStore.actions.getTerminal('pty-1')

// Get active terminal
const active = terminalStore.actions.getActiveTerminal()

// Move terminal to different position
terminalStore.actions.moveTerminal('pty-1', 2)
```

## Testing

Unit tests for the terminal store:

```bash
pnpm test terminal-store
```

## Implementation Details

### WebSocket Protocol

The terminal connects to the OpenCode server via WebSocket at `/pty/{id}/connect`:

- **Client → Server**: User input (keyboard)
- **Server → Client**: Terminal output (ANSI sequences)
- **Resize events**: Sent via OpenCode SDK REST API

### Buffer Persistence

When a terminal is closed or the page reloads:

1. SerializeAddon captures the buffer as ANSI sequences
2. Terminal dimensions and scroll position are saved
3. State is persisted to localStorage via Zustand X
4. On restore, buffer is written back to terminal

### Theme Integration

Terminal colors adapt to the current theme:

```tsx
const DEFAULT_TERMINAL_COLORS = {
  light: {
    background: '#fcfcfc',
    foreground: '#211e1e',
    cursor: '#211e1e',
  },
  dark: {
    background: '#191515',
    foreground: '#d4d4d4',
    cursor: '#d4d4d4',
  },
}
```

Colors update automatically when theme changes via `useTheme()` hook.

### Keyboard Shortcuts

- **Cmd+C / Ctrl+Shift+C**: Copy selection
- **Ctrl+`**: Allow parent app to handle (e.g., toggle terminal)
- All other keys: Sent to terminal

## Future Enhancements

- [ ] Terminal tabs in main UI
- [ ] Split panes
- [ ] Command palette integration
- [ ] Drag & drop reordering
- [ ] Session history
- [ ] Terminal search
- [ ] Custom themes
- [ ] Terminal profiles

## References

- [Ghostty Web Documentation](https://github.com/ghostty-org/ghostty)
- [OpenCode SolidJS Implementation](https://github.com/anomalyco/opencode)
- [xterm.js Serialize Addon](https://github.com/xtermjs/xterm.js/tree/master/addons/addon-serialize)
