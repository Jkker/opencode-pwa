# OpenCode Application - Complete Feature Catalog

## Architecture Overview

- **Framework**: SolidJS with TypeScript
- **UI Library**: @opencode-ai/ui with @kobalte/core primitives
- **Styling**: TailwindCSS 4.x with custom CSS variable theming
- **Client SDK**: @opencode-ai/sdk/v2 for backend communication
- **Routing**: @solidjs/router
- **State Management**: SolidJS stores with custom context providers
- **Persistence**: Local storage utilities

---

## Main Pages & Routes

### 1. **Home Page** (`/`)

- **Recent Projects Display**: Shows up to 5 recently opened projects sorted by last updated time
- **Project Management**:
  - Open new projects using native directory picker or dialog
  - Navigate to existing projects
  - Display relative paths (with `~` for home directory)
- **Server Status Indicator**: Visual indicator showing server health (healthy/unhealthy/unknown)
- **Server Selection**: Quick access to switch OpenCode servers
- **Empty State**: Onboarding view when no recent projects exist

### 2. **Directory Layout** (`/:dir`)

- **Project-Specific Session Management**: Wrapper for project sessions
- **Nested Routes**: Sessions at `/:dir/session/:id?`

### 3. **Session Page** (`/:dir/session/:id`)

- **AI Chat Interface**: Main conversation interface with AI agents
- **Message Rail**: Navigate between user messages in a session
- **Session Turns**: Display individual user/assistant conversation turns with:
  - Steps/toggle expansion
  - File context and references
  - Diff previews
- **Review Panel**: Side panel showing file changes with diff views
- **Terminal Panel**: Integrated terminal with multiple tabs
- **Prompt Input**: Rich text input with file/agent/image attachments

### 4. **Error Page**

- **Error Display**: Formatted error messages with stack traces
- **Update Management**: Check for and install application updates
- **Error Reporting**: Link to Discord feedback channel
- **Version Display**: Shows current application version

---

## Dialog Components & Workflows

### 1. **Connect Provider Dialog** (`DialogConnectProvider`)

**Purpose**: Connect external AI model providers

**Features**:

- **OAuth Flow**: Browser-based OAuth for providers like Anthropic
  - "Login with Claude Pro/Max" variant
  - Authorization code entry
  - Auto-confirmation callback flow
- **API Key Authentication**: Manual API key entry
  - OpenCode Zen integration with special messaging
  - Validation and error handling
- **Multiple Methods**: Support for providers with multiple auth methods
- **Connection Feedback**: Loading states, success/error messages

### 2. **Edit Project Dialog** (`DialogEditProject`)

**Purpose**: Customize project appearance and metadata

**Features**:

- **Project Name**: Edit display name (defaults to folder name)
- **Icon Management**:
  - Upload custom images (drag & drop or file picker)
  - Remove custom icons
  - Avatar fallback with colored initials
- **Color Selection**: 6 predefined color options (pink, mint, orange, purple, cyan, lime)
- **Recommended Size**: 128x128px guidance

### 3. **Manage Models Dialog** (`DialogManageModels`)

**Purpose**: Control which models appear in the model selector

**Features**:

- **Model Visibility Toggles**: Show/hide individual models
- **Provider Grouping**: Models grouped by provider
- **Popular Provider Priority**: Anthropic, OpenCode, OpenAI, Google, OpenRouter prioritized
- **Search**: Filter models by name or provider

### 4. **Select Directory Dialog** (`DialogSelectDirectory`)

**Purpose**: Choose project directories to open

**Features**:

- **Search**: Fuzzy search for directories
- **Path Display**: Shows paths with `~` for home directory
- **Multi-select Support**: Open multiple directories at once
- **File Icons**: Directory icons in list
- **Query Normalization**: Handles `~/` shortcuts

### 5. **Select File Dialog** (`DialogSelectFile`)

**Purpose**: Open specific files in tabs

**Features**:

- **File Search**: Search project files
- **Path Display**: Full path with directory highlighting
- **File Icons**: Type-specific file icons
- **Tab Integration**: Opens files in review panel tabs

### 6. **Select MCP Dialog** (`DialogSelectMcp`)

**Purpose**: Manage Model Context Protocol (MCP) servers

**Features**:

- **MCP Status Display**: Connected, failed, needs_auth, disabled, loading
- **Toggle Connections**: Connect/disconnect MCP servers
- **Error Messages**: Display MCP connection errors
- **Count Display**: Shows X of Y enabled
- **Search**: Filter MCP servers by name

### 7. **Select Model Dialog** (`DialogSelectModel`)

**Purpose**: Choose AI model for prompts

**Features**:

- **Model Search**: Filter by name or provider
- **Recent Models**: Special "Recent" category for quick access
- **Provider Grouping**: Organized by provider
- **Visibility Control**: Respects user's model visibility settings
- **Tags**: "Free" and "Latest" tags on models
- **Connect Provider**: Quick access to connect new providers
- **Manage Models**: Link to full model management dialog
- **Popover Variant**: Smaller popover version for inline selection

### 8. **Select Model Unpaid Dialog** (`DialogSelectModelUnpaid`)

**Purpose**: Model selection optimized for free models

**Features**:

- **Free Models Section**: Dedicated section for free OpenCode models
- **Provider Recommendations**: List of popular providers to connect
- **Connect Provider Flow**: Guides users to connect paid providers
- **Provider Icons**: Visual identification of providers
- **"Recommended" Tag**: Highlights OpenCode Zen

### 9. **Select Provider Dialog** (`DialogSelectProvider`)

**Purpose**: Connect new AI model providers

**Features**:

- **Provider Search**: Filter by ID or name
- **Popular/Other Grouping**: Prioritizes popular providers
- **Provider Icons**: Visual brand identification
- **Connect Flow**: Leads to connect dialog with auth methods

### 10. **Select Server Dialog** (`DialogSelectServer`)

**Purpose**: Switch between OpenCode backend servers

**Features**:

- **Server List**: All configured servers with health status
- **Health Indicators**: Green (healthy), red (unhealthy), gray (unknown)
- **Version Display**: Shows server version when available
- **Add Server**: Add new server URLs with health check
- **Auto-discovery**: Shows current server at top
- **Search**: Filter servers by URL
- **Smart Sorting**: Healthy servers prioritized

---

## Key UI Components

### 1. **File Tree** (`file-tree.tsx`)

**Purpose**: Hierarchical file browser

**Features**:

- **Collapsible Folders**: Expand/collapse directory trees
- **File Icons**: Type-specific icons for files and directories
- **Indentation**: Visual hierarchy based on depth
- **Drag Support**: Drag files for attachment
- **Tooltips**: Full path on hover
- **Ignored Files**: Visual indication of gitignored files

### 2. **Terminal** (`terminal.tsx`)

**Purpose**: Integrated terminal emulator

**Features**:

- **WebSocket Connection**: Real-time PTY communication via `/pty/{id}/connect`
- **Ghostty Integration**: Uses Ghostty Web terminal emulator
- **Theme Support**: Colors adapt to app theme (light/dark)
- **Buffer Persistence**: Saves/restores terminal content and scroll position
- **Copy Support**: Cmd+C / Ctrl+Shift+C for copying selection
- **Custom Keybindings**: Handle special keys without browser interference
- **Resize Handling**: Tracks terminal dimensions and syncs to PTY
- **Serialize Addon**: Serializes terminal state for persistence
- **Fit Addon**: Auto-resize terminal to container

### 3. **Prompt Input** (`prompt-input.tsx`)

**Purpose**: Rich text input for AI conversations

**Features**:

- **Content Editable**: Rich text editing with cursor management
- **Multiple Part Types**:
  - **Text**: Regular message content
  - **File**: File references with optional line selection
  - **Agent**: Agent mentions (@agent-name)
  - **Image**: Image/PDF attachments
- **Image/PDF Attachments**:
  - Paste from clipboard
  - Drag & drop
  - File picker button
  - Preview with filename
  - Remove attachments
- **File/Agent Autocomplete** (`@` trigger):
  - Search files and agents
  - Fuzzy matching
  - Keyboard navigation
- **Slash Commands**: Search and execute commands (e.g., `/new`, `/model`)
- **Emacs-like Keybindings**:
  - Ctrl+A/E for line start/end
  - Ctrl+B/F for character navigation
  - Ctrl+K/U for line killing/yanking
  - Alt+B/F for word navigation
  - Ctrl+T for character swap
- **Prompt History**:
  - Up/Down arrows navigate history
  - Separate history for shell mode
  - Saves last 100 prompts
- **Shell Mode** (`!` prefix):
  - Enter shell command mode
  - Different visual style
  - Esc to exit
- **Agent Selection**: Dropdown to choose AI agent
- **Model Selection**:
  - Dropdown/popover for model choice
  - Shows current model
  - Thinking effort toggle (when available)
- **Auto-accept Toggle**: Enable/disable automatic edit approval
- **Context Usage**: Token count, percentage, and cost tooltip
- **Attachment Button**: Attach images
- **Send/Stop**: Submit prompt or cancel in-progress request
- **Placeholders**: Rotating suggestions for new users

### 4. **Session LSP Indicator** (`session-lsp-indicator.tsx`)

**Purpose**: Display Language Server Protocol status

**Features**:

- **Connection Count**: Shows "X LSP" with connected count
- **Health Indicator**: Green (all good), red (has errors), gray (none)
- **Tooltip**: Lists all LSP server names

### 5. **Session MCP Indicator** (`session-mcp-indicator.tsx`)

**Purpose**: Display MCP server connection status

**Features**:

- **Connection Count**: Shows "X MCP" with enabled count
- **Health Indicator**: Green (all good), red (has failures)
- **Click to Open**: Opens MCP management dialog

### 6. **Session Context Usage** (`session-context-usage.tsx`)

**Purpose**: Display token usage and cost information

**Features**:

- **Token Count**: Total tokens used in last assistant message
- **Context Percentage**: Visual progress circle showing context limit usage
- **Cost Display**: Total cost in USD for session
- **Tooltip**: Detailed breakdown on hover

---

## Context Providers & State Management

### 1. **Platform Context** (`context/platform.tsx`)

**Purpose**: Abstract platform-specific functionality

**Features**:

- **Platform Detection**: Web, desktop, etc.
- **Version Access**: Application version
- **Open Link**: Open URLs in new tabs
- **Restart**: Reload application
- **Notifications**: Native OS notifications
  - Request permission
  - Show notifications when app not focused
  - Click to navigate to session

### 2. **Global SDK Context** (`context/global-sdk.tsx`)

**Purpose**: Global SDK client for cross-project operations

**Features**:

- **SDK Client**: OpenCode API client with server URL
- **Event System**: Global event emitter for real-time updates
- **Event Streaming**: SSE connection for server events
- **Global Operations**: Operations that don't require a specific directory

### 3. **Global Sync Context** (`context/global-sync.tsx`)

**Purpose**: Global state synchronization across all projects

**Features**:

- **Ready State**: Tracks initialization status
- **Error Handling**: Centralized error display
- **Path Information**: Home, config, worktree paths
- **Project List**: All configured projects
- **Provider List**: Available AI model providers
- **Provider Auth**: Authentication status for providers
- **Per-Project State**: Child stores for each project directory
- **Event Handling**: Real-time updates for:
  - `global.disposed`: Reboot required
  - `project.updated`: Project metadata changed
  - `server.instance.disposed`: Project instance reboot
  - `session.updated`: Session created/updated/archived
  - `session.diff`: File changes
  - `message.updated`: New/updated messages
  - `message.part.updated`: Message part changes
  - `permission.updated`: Permission requests
  - `lsp.updated`: LSP server changes
- **Session Loading**: Fetches sessions with pagination (5 + recent)
- **Bootstrap**: Initializes all project state on mount

### 4. **SDK Context** (`context/sdk.tsx`)

**Purpose**: Directory-specific SDK client

**Features**:

- **Directory SDK**: Client scoped to specific project
- **Event Subscription**: Listens to directory-specific events
- **URL**: Server URL access
- **Client Methods**: All SDK API methods for the directory

### 5. **Sync Context** (`context/sync.tsx`)

**Purpose**: Project-level state synchronization

**Features**:

- **Ready State**: Project initialization status
- **Project Info**: Current project metadata
- **Session Management**:
  - Get specific session
  - Add optimistic messages
  - Sync session data
  - Load more sessions (pagination)
  - Archive sessions
- **Message Management**: Message CRUD with parts
- **Diff Management**: File change diffs
- **TODO Management**: Task tracking
- **Permission Management**: Permission requests
- **MCP Status**: MCP server statuses
- **LSP Status**: Language server statuses
- **VCS Info**: Git branch information
- **Path Resolution**: Convert relative to absolute paths

### 6. **Local Context** (`context/local.tsx`)

**Purpose**: Local UI state and caching

**Features**:

- **Agent Management**:
  - List available agents (excluding subagents and hidden)
  - Set current agent
  - Cycle through agents
- **Model Management**:
  - Current model selection per agent
  - Model visibility settings (show/hide)
  - Recent models history
  - Model variants (thinking effort levels)
  - Cycle through recent models
  - Persist user preferences
- **File Management**:
  - File node caching with metadata
  - Load file content on demand
  - Expand/collapse directories
  - Search files (with/without directories)
  - File selection and scrolling
  - View mode (raw/diff-unified/diff-split)
  - Folded regions tracking
- **Context Management**:
  - Tab management for open files
  - Context items (files, agents)
  - Active file tracking

### 7. **Terminal Context** (`context/terminal.tsx`)

**Purpose**: Terminal tab management

**Features**:

- **Terminal List**: All terminal PTY instances
- **Active Terminal**: Currently focused terminal
- **Create Terminal**: New PTY with sequential naming
- **Update Terminal**: Update title and size
- **Clone Terminal**: Create copy of existing terminal
- **Close Terminal**: Remove PTY and switch to previous
- **Move Terminal**: Reorder tabs via drag & drop
- **Persistence**: Save terminal state across sessions

### 8. **Permission Context** (`context/permission.tsx`)

**Purpose**: Permission request handling and auto-approval

**Features**:

- **Permissions Enabled**: Check if feature is configured
- **Auto-accept Edits**: Toggle automatic approval for edit/write operations
- **Auto-respond**: Respond to permission requests when auto-accepting
- **Session Toggle**: Enable/disable auto-accept per session
- **Persistence**: Save auto-accept preferences

### 9. **Layout Context** (`context/layout.tsx`)

**Purpose**: UI layout state and persistence

**Features**:

- **Sidebar Management**:
  - Toggle open/close
  - Resize width (150-30% of viewport)
  - Collapse threshold
- **Terminal Panel**:
  - Toggle open/close
  - Resize height (100-60% of viewport)
- **Review Panel**:
  - Toggle open/close
  - Diff style (unified/split)
- **Session Panel**:
  - Resize width
- **Project Management**:
  - List projects with metadata
  - Open/close projects
  - Expand/collapse project lists
  - Move projects (reorder)
  - Enrich with colors and icons
- **Tab Management**: Per-session tab state for review panel
- **Avatar Colors**: 6-color palette with automatic assignment

### 10. **Command Context** (`context/command.tsx`)

**Purpose**: Command palette and keyboard shortcuts

**Features**:

- **Command Palette**: Search and execute all commands (Mod+Shift+P)
- **Keyboard Shortcuts**: Global keybinding handling
  - Cross-platform (Mod = Cmd on Mac, Ctrl on Windows/Linux)
  - Suspend keybinds when needed
- **Command Registration**: Components register their commands
- **Suggested Commands**: Quick access to common actions
- **Slash Commands**: Access commands via `/` in prompt
- **Keybind Display**: Formatted keybinds with symbols (⌘⇧P)
- **Categories**: Commands grouped by category
- **On Highlight**: Preview effects when selecting commands

### 11. **Prompt Context** (`context/prompt.tsx`)

**Purpose**: Prompt input state and management

**Features**:

- **Prompt Parts**: Complex prompt structure (text, files, agents, images)
- **Cursor Position**: Track cursor within parts
- **Dirty State**: Track if prompt has been modified
- **Persistence**: Save prompt per session
- **Reset**: Clear to default state
- **Equality Comparison**: Check if two prompts are equivalent

### 12. **Notification Context** (`context/notification.tsx`)

**Purpose**: In-app notification tracking

**Features**:

- **Session Notifications**: Track per-session unseen notifications
- **Project Notifications**: Track per-project unseen notifications
- **View Status**: Mark notifications as viewed
- **Unseen Counts**: Get count of unseen notifications

---

## Hooks

### 1. **Use Providers** (`hooks/use-providers.ts`)

**Purpose**: Provider data and connection management

**Features**:

- **All Providers**: Complete provider list
- **Connected Providers**: Filter to authenticated providers
- **Paid Providers**: Connected providers with paid models
- **Popular Providers**: Prioritized list (OpenCode, Anthropic, GitHub Copilot, OpenAI, Google, OpenRouter, Vercel)
- **Default Provider**: Project/configured default

---

## Key Integrations

### 1. **MCP (Model Context Protocol)**

**Purpose**: Extensible context providers

**Features**:

- **Status Display**: Connected, failed, needs_auth, disabled
- **Toggle Connections**: Enable/disable MCP servers
- **Configuration**: MCP servers defined in project config
- **Error Handling**: Display connection errors

### 2. **LSP (Language Server Protocol)**

**Purpose**: Language intelligence

**Features**:

- **Status Tracking**: Connection status per language server
- **Multi-server**: Support for multiple LSP servers
- **Status Display**: Health indicators in UI
- **Real-time Updates**: SSE-based status changes

### 3. **VCS (Version Control System)**

**Purpose**: Git integration

**Features**:

- **Branch Display**: Show current Git branch in UI
- **Branch Updates**: Real-time branch change events
- **File Status**: Track modified/added/deleted files

### 4. **Terminal / PTY**

**Purpose**: Integrated command-line interface

**Features**:

- **WebSocket PTY**: Remote PTY sessions via WebSocket
- **Multiple Terminals**: Tab-based terminal management
- **Persistence**: Save buffer and scroll position
- **Cloning**: Copy terminal configuration to new instance
- **Theme Integration**: Colors match app theme

### 5. **Web Speech API**

**Purpose**: Voice input (via `utils/speech.ts`)

**Features**:

- **Speech Recognition**: Browser-based speech-to-text
- **Microphone Access**: Request microphone permissions

---

## User Workflows & Capabilities

### 1. **Project Management**

- Open new projects via directory picker or dialog
- Switch between projects
- Edit project name and icon
- Close projects
- Reorder projects via drag & drop
- Auto-load project sessions

### 2. **Session Workflows**

- **Create New Session**: Fresh conversation with AI
- **Continue Session**: Resume existing conversation
- **Navigate Sessions**: Browse session history
- **Archive Session**: Remove old sessions
- **Share Session**: Generate shareable URL (when enabled)
- **Undo/Redo**: Revert and unrevert messages

### 3. **AI Interaction**

- **Text Prompts**: Type messages to AI
- **File Context**: Attach files with optional line selection
- **Agent Selection**: Choose specific AI agents
- **Model Selection**: Pick AI model with thinking effort
- **Multi-turn Conversations**: Full chat history
- **Shell Commands**: Execute terminal commands (`!` prefix)
- **Custom Commands**: Execute project-defined commands (`/command`)
- **Image/PDF Input**: Attach images and PDFs to prompts
- **Auto-scroll**: Follow conversation as new messages arrive
- **Stop Generation**: Cancel in-progress requests

### 4. **Code Review**

- **Diff View**: See proposed changes (unified or split)
- **File Navigation**: Browse changed files in tabs
- **Accept/Reject**: Approve or deny individual changes
- **Auto-accept Mode**: Automatically approve all edits
- **Diff Changes**: Summary of added/modified/deleted lines

### 5. **Customization**

- **Theme Selection**: Multiple built-in themes
- **Color Scheme**: Light, dark, or system preference
- **Layout Configuration**:
  - Sidebar width
  - Terminal height
  - Panel toggles
- **Model Visibility**: Control which models appear
- **Prompt History**: Saved for quick access

### 6. **Keyboard Navigation**

- **Command Palette** (Mod+Shift+P): Search and execute commands
- **Session Navigation**: Mod+Alt+ArrowUp/Down
- **Message Navigation**: Mod+ArrowUp/Down
- **Sidebar Toggle**: Mod+B
- **Terminal Toggle**: Ctrl+`
- **New Terminal**: Ctrl+Shift+`
- **Review Toggle**: Mod+Shift+R
- **New Session**: Mod+Shift+S
- **Open File**: Mod+P
- **Choose Model**: Mod+'
- **Toggle MCPs**: Mod+;
- **Cycle Agent**: Mod+. (Shift+Mod+. for reverse)
- **Toggle Steps**: Mod+E
- **Archive Session**: Mod+Shift+Backspace
- **Auto-accept Edits**: Mod+Shift+A
- **Cycle Theme**: Mod+Shift+T
- **Cycle Color Scheme**: Mod+Shift+S
- **Cycle Thinking Effort**: Shift+Mod+T
- **Emacs Keybindings**: Full set of Emacs-style text editing keys

### 7. **Server Management**

- **Switch Servers**: Connect to different OpenCode backends
- **Add Custom Servers**: Add server URLs manually
- **Health Checks**: Visual status for each server
- **Auto-discovery**: Detects development vs production server

### 8. **Provider Authentication**

- **Connect OpenCode Zen**: API key authentication
- **Connect Anthropic**: OAuth with Claude Pro/Max or API key
- **Connect OpenAI, Google, etc.**: OAuth or API key
- **Disconnect Providers**: Remove provider connections
- **Authorization Flows**:
  - Browser-based OAuth redirect
  - Authorization code entry
  - Automatic confirmation callbacks

---

## Utilities & Addons

### 1. **Serialize Addon** (`addons/serialize.ts`)

**Purpose**: Serialize terminal state for persistence

- Captures buffer content
- Saves cursor position
- Stores scroll history

### 2. **Persist Utility** (`utils/persist.ts`)

**Purpose**: LocalStorage wrapper

- Type-safe storage with SolidJS stores
- Versioning support
- Automatic migration

### 3. **ID Utility** (`utils/id.ts`)

**Purpose**: ID generation

- Ascending ID generator
- Custom ID prefixes

### 4. **Prompt Utility** (`utils/prompt.ts`)

**Purpose**: Prompt parsing and reconstruction

- Extract prompt from message parts
- Reconstruct prompt from parts

### 5. **DOM Utility** (`utils/dom.ts`)

**Purpose**: DOM helper functions

### 6. **Solid DND** (`utils/solid-dnd.tsx`)

**Purpose**: Drag and drop utilities

- Constrain to axis
- Draggable ID extraction

---

## Additional Features

### 1. **Real-time Updates**

- **SSE Events**: Server-sent events for live updates
- **Optimistic UI**: Immediate feedback before server confirmation
- **Conflict Resolution**: Handle simultaneous updates

### 2. **Error Handling**

- **Error Boundaries**: Catch and display errors gracefully
- **Error Recovery**: Retry with exponential backoff
- **Error Formatting**: User-friendly error messages
- **Init Error Types**: Specific handling for:
  - MCPFailed
  - ProviderAuthError
  - APIError
  - ProviderInitError
  - ConfigJsonError
  - ConfigInvalidError

### 3. **Accessibility**

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML
- **Focus Management**: Proper focus handling in dialogs
- **Tooltips**: Additional information on hover

### 4. **Responsive Design**

- **Mobile Layout**: Collapsible sidebar, tab-based navigation
- **Desktop Layout**: Sidebar, review panel, terminal panel
- **Breakpoints**: XL (1280px) for desktop features
- **Adaptive**: Components adjust to screen size

### 5. **Performance**

- **Lazy Loading**: Load sessions on demand
- **Pagination**: Limit initial session count
- **Virtualization**: Use virtual lists for large datasets
- **Caching**: File content and node caching
- **Optimistic Updates**: Reduce perceived latency

### 6. **Notifications**

- **Native OS Notifications**: When app is not focused
- **In-app Toaster**: Toast notifications for feedback
- **Permission Alerts**: Prompt user for required permissions
- **Update Alerts**: Notify of available updates

---

## File Types & Extensions

- **Session Storage**: `.v1` persisted files for terminal and layout
- **History Storage**: Prompt history persisted locally
- **Image Types**: PNG, JPEG, GIF, WebP supported
- **PDF Support**: PDF file attachments
- **Code Files**: Syntax highlighting via Shiki
