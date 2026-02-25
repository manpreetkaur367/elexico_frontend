import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Lightbulb, CheckCircle2 } from "lucide-react";
import type { Slide } from "../data/slides";

interface Message {
  role: "user" | "ai";
  text: string;
}

// Per-slide chat response banks keyed by slide id
const slideResponses: Record<number, Record<string, string>> = {
  1: {
    "what languages are used for backend?": "Common backend languages include JavaScript (Node.js), Python (Django/FastAPI), Java (Spring Boot), Go, Ruby (Rails), and Rust. Node.js excels at real-time apps, Python at data/ML tasks, Go at raw performance.",
    "what is a rest api?": "A REST API uses standard HTTP methods (GET, POST, PUT, DELETE) and stateless communication. Resources are identified by URLs and data is exchanged in JSON. It's the most widely used API style today.",
    "how does backend differ from frontend?": "The frontend is what users see in their browser (HTML, CSS, JS). The backend is the server-side engine — it runs business logic, queries databases, enforces security, and returns data to the frontend via APIs.",
    "what is microservices?": "Microservices split a backend into small, independently deployable services (e.g. auth service, payment service, notifications). Each runs its own process and communicates over APIs. This improves scalability and fault isolation.",
    "what is cloud computing?": "Cloud computing lets you rent servers, databases, and storage on demand from providers like AWS, GCP, or Azure — without owning physical hardware. You pay for what you use and can scale up or down instantly.",
  },
  2: {
    "what is nginx?": "Nginx (engine-x) is a high-performance web server and reverse proxy. It serves static files, load balances traffic, handles SSL termination, and can act as an API gateway — all with very low memory usage.",
    "difference between server and cloud?": "A server is a physical or virtual machine. The cloud is a network of servers managed by providers (AWS, GCP, Azure) that you rent on demand. Cloud adds auto-scaling, managed services, and global distribution.",
    "how does docker relate to servers?": "Docker packages your app + its dependencies into a container that runs identically on any server. Instead of setting up a server manually, you ship a Docker image. Kubernetes then orchestrates many containers across many servers.",
    "what is a load balancer?": "A load balancer distributes incoming traffic across multiple server instances. If server 1 is busy, it routes the next request to server 2. This prevents any single server from becoming a bottleneck and improves availability.",
    "what is a cdn?": "A CDN (Content Delivery Network) caches your static assets (images, CSS, JS) on servers around the world. When a user in Tokyo visits your site, they get files from a Tokyo CDN node — not from your server in the US — making it much faster.",
  },
  3: {
    "what is rest vs graphql?": "REST has fixed endpoints (/users, /posts) — you get back all fields. GraphQL has one endpoint and you ask for exactly the fields you need. REST is simpler; GraphQL prevents over-fetching in complex UIs.",
    "how is an api secured?": "APIs are secured with: API keys (simple token), JWT Bearer tokens (stateless), OAuth 2.0 (delegated auth), HTTPS (encrypted transport), rate limiting (prevent abuse), and CORS policies (restrict which domains can call).",
    "what is a webhook?": "A webhook is a reverse API call — instead of your app polling a service for updates, the service calls your endpoint when something happens. E.g. Stripe calls your /webhook endpoint when a payment succeeds.",
    "what is an api key?": "An API key is a unique token passed in the request header that identifies the calling application. It's used for authentication and rate limiting. Unlike JWTs, API keys don't carry user identity claims.",
    "what is grpc?": "gRPC is a high-performance RPC framework from Google. It uses Protocol Buffers (binary format, much smaller than JSON) and HTTP/2. It's mainly used for internal microservice communication where performance is critical.",
  },
  4: {
    "sql vs nosql — when to use which?": "Use SQL (PostgreSQL, MySQL) when your data is structured, you need ACID transactions, and relationships matter. Use NoSQL (MongoDB, Redis) when your schema is flexible, you need horizontal scaling, or you're storing unstructured data.",
    "what is database indexing?": "An index is a data structure (B-tree or hash) that lets the database jump directly to matching rows instead of scanning every row. It speeds up reads by 100-1000x on large tables — at the cost of slightly slower writes and extra storage.",
    "what is an orm?": "An ORM (Object Relational Mapper) lets you interact with a database using your programming language instead of raw SQL. Prisma, Sequelize, and TypeORM are popular Node.js ORMs. They generate SQL from code and handle migrations.",
    "what is acid?": "ACID stands for: Atomicity (all-or-nothing transactions), Consistency (data always valid), Isolation (concurrent transactions don't interfere), Durability (committed data survives crashes). These guarantee reliable SQL transactions.",
    "what is redis?": "Redis is an in-memory key-value store — blazing fast (<1ms reads). It's used for: caching database results, storing sessions, rate limiting counters, pub/sub messaging, and leaderboards. Data is stored in RAM, so it's not for permanent storage.",
  },
  5: {
    "what is jwt?": "JWT (JSON Web Token) has 3 parts: Header (algorithm), Payload (user id, roles, expiry), and Signature (HMAC/RSA). The server signs it on login; the client sends it on every request. No DB lookup needed — just verify the signature.",
    "oauth vs session auth?": "Sessions: server stores session data, client holds only a session ID cookie — stateful. OAuth/JWT: client holds a signed token with claims — stateless, scales better. OAuth is for delegated access (Login with Google).",
    "how to store passwords safely?": "NEVER store plain-text passwords. Hash them with bcrypt or Argon2 — these are slow by design (making brute-force expensive). Use 10-12 bcrypt rounds. Always add a unique salt per password to prevent rainbow table attacks.",
    "what is mfa?": "Multi-Factor Authentication requires a second proof of identity beyond password: a TOTP code (Google Authenticator), SMS code, biometric, or hardware key. MFA blocks 99.9% of automated account attacks even if the password is leaked.",
    "what is oauth?": "OAuth 2.0 is a delegation protocol — it lets users grant apps limited access to their accounts without sharing passwords. 'Login with Google' uses OAuth: Google authenticates you and issues an access token to the requesting app.",
  },
  6: {
    "what is middleware in express?": "Middleware are functions in the request pipeline: (req, res, next) => {}. They run before your route handler. Common uses: logging (Morgan), auth verification, body parsing (express.json()), rate limiting, CORS headers.",
    "node.js vs python for backend?": "Node.js: same language as frontend, huge npm ecosystem, excellent for I/O-heavy and real-time apps. Python: cleaner syntax, dominant in data/ML, great frameworks (Django, FastAPI). For pure APIs — both are excellent choices.",
    "what is npm?": "npm (Node Package Manager) is the world's largest software registry with 2.5M+ packages. You can add any package to your project with 'npm install'. It manages dependencies, scripts, and versioning via package.json.",
    "what is the event loop?": "Node.js is single-threaded but handles thousands of concurrent connections via the event loop. When an async operation (DB query, file read) starts, Node registers a callback and moves on. When the operation completes, the callback runs — no thread blocking.",
    "what is nestjs?": "NestJS is a structured, TypeScript-first Node.js framework inspired by Angular. It uses decorators, dependency injection, and modules. It's opinionated (unlike Express) and is popular for large enterprise backends.",
  },
  7: {
    "what is dns?": "DNS (Domain Name System) translates domain names (google.com) to IP addresses (142.250.80.46). Your browser queries a DNS resolver (ISP or 8.8.8.8), which returns the IP. Results are cached (TTL: typically 300s) to avoid repeated lookups.",
    "what are http headers?": "HTTP headers are key-value metadata sent with every request/response. Request headers: Authorization (auth token), Content-Type, Accept, Cookie. Response headers: Set-Cookie, Cache-Control, Content-Encoding, CORS headers.",
    "how does https work?": "HTTPS = HTTP + TLS encryption. During the TLS handshake, the server presents a certificate, they negotiate an encryption algorithm, exchange keys, and establish an encrypted tunnel. All subsequent data is encrypted — unreadable to anyone intercepting.",
    "what are http status codes?": "2xx = Success (200 OK, 201 Created, 204 No Content). 3xx = Redirect (301 Permanent, 302 Temporary, 304 Not Modified). 4xx = Client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Rate Limited). 5xx = Server error (500, 502, 503).",
    "what is http/2?": "HTTP/2 improves on HTTP/1.1 with: multiplexing (multiple requests over one connection simultaneously), header compression (HPACK), server push (server sends assets before browser requests them), and binary framing. Typically 2-3x faster.",
  },
  8: {
    "websockets vs http polling?": "HTTP polling asks 'any updates?' on a timer — wastes bandwidth. Long polling waits until the server has something. WebSockets open one persistent TCP connection — server and client both push data instantly at any time. Far more efficient for real-time.",
    "how does socket.io work?": "Socket.IO wraps WebSockets with extras: automatic reconnection, rooms (grouped connections), namespaces, and HTTP long-polling fallback. You emit events (socket.emit('message', data)) and listen for them — like a real-time event bus.",
    "what is webrtc?": "WebRTC (Web Real-Time Communication) enables peer-to-peer audio, video, and data directly between browsers — no server in the media path. Used by Google Meet, Zoom (hybrid), and Discord. Signaling still goes through a server, but the actual streams are P2P.",
    "what is kafka?": "Apache Kafka is a distributed event streaming platform. Producers write messages to topics; consumers read them. It handles millions of messages/second with persistence and replay. Used for real-time analytics, event sourcing, and microservice communication.",
    "what is redis pub/sub?": "Redis Pub/Sub lets services publish messages to channels and subscribe to receive them. When scaling WebSocket servers horizontally, Redis Pub/Sub synchronizes messages across all instances — when user A on server 1 sends a message, users on server 2 also receive it.",
  },
};

function getAIResponse(question: string, slide: Slide): string {
  const slideBank = slideResponses[slide.id] ?? {};
  const key = question.toLowerCase().trim();

  // Exact match
  if (slideBank[key]) return slideBank[key];

  // Fuzzy: check if any stored key words appear in the question
  for (const [k, v] of Object.entries(slideBank)) {
    const keyWords = k.replace(/[^a-z0-9 ]/g, "").split(" ").filter(w => w.length > 3);
    if (keyWords.some(word => key.includes(word))) return v;
  }

  // Cross-slide fallback: search all slide banks
  for (const bank of Object.values(slideResponses)) {
    for (const [k, v] of Object.entries(bank)) {
      const keyWords = k.replace(/[^a-z0-9 ]/g, "").split(" ").filter(w => w.length > 4);
      if (keyWords.some(word => key.includes(word))) return v;
    }
  }

  return `Good question about "${slide.title}"! Here's a quick summary: ${slide.aiInsight} — Try one of the suggested questions for a detailed answer.`;
}

interface AIInsightsPanelProps {
  slide: Slide;
}

export default function AIInsightsPanel({ slide }: AIInsightsPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevSlideId = useRef(slide.id);

  useEffect(() => {
    if (prevSlideId.current !== slide.id) {
      setMessages([]);
      setActiveTab("summary");
      prevSlideId.current = slide.id;
    }
  }, [slide.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: text.trim() }]);
    setInput("");
    setIsTyping(true);
    setActiveTab("chat");
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: getAIResponse(text, slide) }]);
      setIsTyping(false);
    }, 700 + Math.random() * 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#ffffff" }}>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0 relative overflow-hidden"
        style={{ borderBottom: "1px solid #e8edf5" }}>
        {/* Blue glow behind header */}
        <div className="absolute top-0 right-0 w-40 h-20 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #2563eb18 0%, transparent 70%)",
            transform: "translate(20%, -20%)",
          }} />
        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              boxShadow: "0 4px 16px #2563eb50",
            }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[15px] font-black text-gray-900 tracking-tight">AI Insights</p>
            <p className="text-[11px] text-gray-500 font-medium">Powered by ElexicoAI</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex px-4 pt-3.5 pb-2 gap-1.5 flex-shrink-0">
        {(["summary", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-[12px] font-black rounded-xl capitalize transition-all tracking-wide items-center justify-center flex gap-1.5"
            style={activeTab === tab
              ? { background: "#2563eb1e", color: "#2563eb", borderColor: "#2563eb35", border: "1px solid" }
              : { background: "transparent", color: "#94a3b8", borderColor: "transparent", border: "1px solid" }
            }
          >
            {tab}
            {tab === "chat" && messages.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: "#2563eb", color: "#fff" }}>
                {messages.filter(m => m.role === "ai").length}
              </motion.span>
            )}
          </button>
        ))}
      </div>

      {/* ══ SUMMARY TAB ══ */}
      <AnimatePresence mode="wait">
        {activeTab === "summary" && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-thin min-h-0"
          >
            {/* AI Analogy */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em]">Simple Analogy</span>
              </div>
              <div className="rounded-xl p-4 relative overflow-hidden"
                style={{ background: "#2563eb0c", border: "1px solid #2563eb22" }}>
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
                  style={{ background: "radial-gradient(circle, #2563eb20 0%, transparent 70%)", transform: "translate(25%, -25%)" }} />
                <p className="text-[13px] text-gray-600 leading-relaxed relative z-10">{slide.aiInsight}</p>
              </div>
            </div>

            {/* Key Points */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em]">Key Points</span>
              </div>
              <ul className="space-y-2">
                {slide.keyPoints.map((point, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-start gap-2.5">
                    <div className="mt-[5px] w-4 h-4 rounded-md flex-shrink-0 flex items-center justify-center"
                      style={{ background: "#2563eb16", border: "1px solid #2563eb28" }}>
                      <span className="w-1.5 h-1.5 rounded-full block bg-blue-600" />
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{point}</p>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.14em] mb-2.5">Ask AI</p>
              <div className="flex flex-col gap-2">
                {slide.chatSuggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    whileHover={{ x: 3 }}
                    onClick={() => sendMessage(s)}
                    className="text-left text-[12px] px-4 py-2.5 rounded-xl transition-all border font-medium"
                    style={{ color: "#2563eb", borderColor: "#2563eb20", background: "#2563eb08" }}
                  >
                    → {s}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ CHAT TAB ══ */}
        {activeTab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin min-h-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                    <Bot className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 text-center leading-relaxed">
                    Ask me anything about<br />
                    <span className="text-gray-700 font-bold">{slide.title}</span>
                  </p>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={msg.role === "ai"
                        ? { background: "#2563eb22", border: "1px solid #2563eb30" }
                        : { background: "#2563eb" }}>
                      {msg.role === "user"
                        ? <User className="w-3.5 h-3.5 text-white" />
                        : <Bot className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed border ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm border-transparent"
                        : "rounded-tl-sm text-gray-700"
                    }`}
                      style={msg.role === "ai" ? {
                        background: "#f1f5f9",
                        borderColor: "#e2e8f0",
                      } : {}}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 items-center">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: "#2563eb22", border: "1px solid #2563eb30" }}>
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 border"
                    style={{ background: "#f1f5f9", borderColor: "#e2e8f0" }}>
                    {[0, 1, 2].map((j) => (
                      <motion.div key={j}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, delay: j * 0.15, repeat: Infinity }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#2563eb" }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion chips */}
            {messages.length === 0 && (
              <div className="px-5 pb-3 flex flex-col gap-2 flex-shrink-0">
                {slide.chatSuggestions.map((s, i) => (
                  <motion.button key={i} whileHover={{ x: 2 }}
                    onClick={() => sendMessage(s)}
                    className="text-left text-[12px] px-4 py-2.5 rounded-xl border transition-all font-medium"
                    style={{ color: "#2563eb", borderColor: "#2563eb25", background: "#2563eb0a" }}>
                    → {s}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat input (always visible) ── */}
      <div className="px-4 pb-5 pt-3.5 flex-shrink-0"
        style={{ borderTop: "1px solid #e8edf5" }}>
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${slide.title}...`}
            className="flex-1 text-[13px] px-4 py-3 rounded-xl outline-none transition-all placeholder-gray-400 text-gray-800 font-medium"
            style={{ background: "#f8faff", border: "1px solid #e2e8f0" }}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563eb50";
              e.target.style.background = "#ffffff";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.background = "#f8faff";
            }}
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-25 transition-all flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              boxShadow: "0 2px 14px #2563eb35",
            }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
