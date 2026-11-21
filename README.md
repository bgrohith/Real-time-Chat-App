# SapphireIQ Real-time Chat App
### Full Stack Developer Student Project: React + Node.js + Express + MongoDB + Socket.io

A full-stack, production-ready real-time chat application featuring 1-on-1 direct messaging, multi-user group conversations, live WebSockets, presence indicators, animated typing states, read receipts, image sharing, and message history with pagination.

---

## 🚀 Key Modules Built (Per SapphireIQ 4-Week Roadmap)

### Module 1: Setup, Auth & Data Models
- **Express & Node.js REST API**: Architecture with modular routes, controllers, and middleware.
- **MongoDB Data Models**:
  - `User`: Username, email, bcrypt-hashed password, avatar, and custom bio status.
  - `Conversation`: 1-on-1 or multi-user groups, member references, unread counts map, last message reference.
  - `Message`: Sender reference, conversation reference, text content, image attachments, read receipts list (`readBy`).
- **JWT Authentication**: Secure user registration, login with email or username, and auth middleware verifying bearer tokens.

### Module 2: Conversations & REST Messaging
- **User Discovery & Search**: Live search query to find users across the platform.
- **Find or Create 1-on-1 Conversations**: Reuses existing direct chats or instantiates a new one seamlessly.
- **Message History & Pagination**: Indexed queries with cursor/page parameters (`page`, `limit`, `hasMore`) and "Load older messages".
- **Responsive Three-Pane Component Architecture**: Clean sidebar, rich chat container, and reactive message input.

### Module 3: Live Messaging with Socket.io
- **Authenticated Sockets**: Socket handshake middleware validates JWT token before allowing connection.
- **Room Management**: Dynamic rooms per conversation (`conv:<conversationId>`) and personal user rooms (`user:<userId>`).
- **Save & Broadcast**: Instant WebSocket delivery to room participants with immediate database persistence.

### Module 4: Presence, Typing & Unread Counts
- **Real-Time Presence**: Tracks online sockets per user and broadcasts `online_users`, `user_online`, and `user_offline` events with green status dots.
- **Live Typing Indicators**: Debounced `typing_start` and `typing_stop` socket events render animated three-dot indicators in real time.
- **Read State & Unread Badges**: Tracks unread counts per user per conversation; clears counts and marks `readBy` on chat open.

### Module 5: Groups, Images & Deployment
- **Group Conversations**: Any user can create multi-member groups with a custom name. Group administrators can invite and add new members.
- **Image Sharing**: Image uploads powered by Multer with file type validation, image preview before sending, inline thumbnail rendering, and full-screen preview lightbox modal.
- **Deployment Ready**: Vite production build pipeline, production single-port serving via Express, flexible MongoDB configuration (supports local MongoDB, MongoDB Atlas URI, or built-in zero-config embedded MongoDB).

---

## 🛠️ Project Structure

```
chatbot/
├── package.json               # Root scripts (dev, seed, build, start)
├── README.md                  # Comprehensive documentation
├── .env.example               # Environment variables template
├── server/                    # Node.js + Express backend
│   ├── .env                   # Server environment config
│   ├── package.json
│   ├── uploads/               # Statically served user image uploads
│   └── src/
│       ├── config/            # MongoDB connection (Atlas / local / memory fallback)
│       ├── controllers/       # Auth, User, Conversation, Message controllers
│       ├── middleware/        # JWT auth protection & Multer upload middleware
│       ├── models/            # Mongoose models (User, Conversation, Message)
│       ├── routes/            # REST API routes
│       ├── socket/            # Socket.io authentication & event handlers
│       ├── seed.js            # Sample data seeder with demo accounts
│       └── server.js          # Main Express server entry point
└── client/                    # React 18 + Vite frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx            # Main app shell & auth routing
        ├── main.jsx           # React root with Context Providers
        ├── context/           # AuthContext & SocketContext
        ├── services/          # Axios API & Socket.io client
        └── components/
            ├── auth/          # Login & Register with 1-click demo logins
            ├── sidebar/       # User profile, search, tabs, chat list, group modal
            ├── chat/          # Chat header, message list, bubbles, input, lightbox
            └── common/        # Avatar with online presence badge
```

---

## 🏁 Quick Start Guide

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment (Optional)
The server works **out of the box** without any manual configuration!
If you have a MongoDB Atlas connection string, you can set it in `server/.env`:
```env
PORT=5000
JWT_SECRET=sapphire_realtime_chat_super_secret_jwt_key_2026
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/sapphire_chat
```
*If `MONGODB_URI` is left blank, the server automatically starts an in-memory MongoDB instance for instant zero-setup testing.*

### 3. Seed Sample Data (Optional)
Populate the database with pre-configured demo users, conversations, and messages:
```bash
cd server
npm run seed
```
Demo accounts created (Password for all: `password123`):
- `alice@example.com` (username: `alice`)
- `bob@example.com` (username: `bob`)
- `charlie@example.com` (username: `charlie`)
- `dana@example.com` (username: `dana`)

### 4. Run the Application
In terminal 1 (start backend):
```bash
cd server
npm run dev
```

In terminal 2 (start frontend):
```bash
cd client
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🧪 Testing Real-Time Features (Two-Browser Workflow)

To verify the live features per Module 3 & 4:
1. Open **Browser 1** (e.g. Chrome) at `http://localhost:5173` and click **"👩‍💻 Alice"** demo login.
2. Open **Browser 2** (e.g. Incognito window or Firefox) at `http://localhost:5173` and click **"👨‍💻 Bob"** demo login.
3. Observe:
   - **Online Status**: Alice sees a green online badge on Bob's avatar, and vice-versa.
   - **Real-Time Messages**: Send a message from Alice — it appears on Bob's screen immediately without refreshing.
   - **Typing Indicator**: When Alice starts typing, Bob immediately sees *"Alice is typing..."*.
   - **Unread Count**: When Bob receives a message while looking at another conversation or before opening Alice's chat, an unread counter badge appears and clears once opened.
   - **Group Chat**: Both users can join the *"SapphireIQ Dev Team 🚀"* group and chat simultaneously.
   - **Image Sharing**: Attach an image via the paperclip/image button, preview it, and send it to see live image rendering and lightbox expansion.

---

## 📡 REST API Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Login with username/email and password |
| `GET` | `/api/auth/me` | Fetch currently authenticated user |
| `GET` | `/api/users?search=` | Search users across the application |
| `GET` | `/api/conversations` | Get all conversations for current user |
| `POST` | `/api/conversations/direct` | Find or create 1-on-1 direct conversation |
| `POST` | `/api/conversations/group` | Create multi-member group conversation |
| `POST` | `/api/conversations/:id/members` | Add user to group (Admin only) |
| `PUT` | `/api/conversations/:id/read` | Mark conversation messages as read |
| `GET` | `/api/messages/:conversationId` | Paginated message history |
| `POST` | `/api/messages` | Send message with text and/or image upload |

---

## 🔌 Socket.io Events Summary

| Event Name | Direction | Payload / Purpose |
|---|---|---|
| `connection` | Client -> Server | Handshake with JWT token in `auth.token` |
| `online_users` | Server -> Client | Array of active online user IDs |
| `user_online` / `user_offline` | Server -> Client | Real-time presence transition notification |
| `join_conversation` | Client -> Server | Joins conversation room (`conv:<id>`) |
| `leave_conversation` | Client -> Server | Leaves conversation room |
| `send_message` | Client -> Server | Emits new message object |
| `new_message` | Server -> Client | Broadcasts message to room members |
| `typing_start` / `typing_stop` | Client -> Server | Emits typing indicator state |
| `user_typing` / `user_stop_typing`| Server -> Client | Broadcasts typing state to conversation |
| `mark_read` | Client -> Server | Clears unread counts and marks read receipts |
| `conversation_updated` | Server -> Client | Updates sidebar conversation order & snippets |
