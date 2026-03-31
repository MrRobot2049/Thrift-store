import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import NavBar from "./NavBar";
import "./chat.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export default function ChatPage() {
  const { auctionId } = useParams();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const otherParty = useMemo(() => {
    if (!room || !currentUser?.id) {
      return null;
    }

    if (room.seller?._id === currentUser.id) {
      return room.winner;
    }

    return room.seller;
  }, [room, currentUser?.id]);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/chats/auction/${auctionId}`, {
          credentials: "include",
          headers: { Authorization: token },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Unable to access chat");
        }

        setRoom(data.room);
        setMessages(data.messages || []);
      } catch (err) {
        setError(err.message || "Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchChat();
    } else {
      setLoading(false);
      setError("Please log in to access chat");
    }
  }, [auctionId, token]);

  useEffect(() => {
    if (!token || !room) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketReady(true);
      socket.emit("chat:joinAuction", { auctionId });
    });

    socket.on("disconnect", () => {
      setSocketReady(false);
    });

    socket.on("chat:newMessage", (message) => {
      setMessages((prev) => {
        if (prev.some((entry) => entry._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    socket.on("chat:error", (payload) => {
      setError(payload?.message || "Chat error");
    });

    return () => {
      socket.disconnect();
    };
  }, [auctionId, room, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim()) {
      return;
    }

    if (socketRef.current && socketReady) {
      socketRef.current.emit("chat:sendMessage", {
        auctionId,
        text: draft,
      });
      setDraft("");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/chats/auction/${auctionId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ text: draft }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setMessages((prev) => [...prev, data]);
      setDraft("");
    } catch (err) {
      setError(err.message || "Failed to send message");
    }
  };

  return (
    <div className="chat-page">
      <NavBar />

      <div className="chat-shell">
        <div className="chat-head">
          <div>
            <h1>Auction Chat</h1>
            <p>
              {room?.item?.title || "Auction"}
              {otherParty?.name ? ` • Chatting with ${otherParty.name}` : ""}
            </p>
          </div>
          <div className={`chat-live ${socketReady ? "online" : "offline"}`}>
            {socketReady ? "Live" : "Offline"}
          </div>
        </div>

        {loading && <p className="chat-state">Loading chat...</p>}
        {!loading && error && <p className="chat-state error">{error}</p>}

        {!loading && !error && (
          <>
            <div className="chat-messages">
              {messages.length === 0 && (
                <p className="chat-empty">Start the conversation about payment, delivery, and next steps.</p>
              )}

              {messages.map((message) => {
                const mine = message.sender?._id === currentUser.id;
                return (
                  <div key={message._id} className={`chat-bubble ${mine ? "mine" : "theirs"}`}>
                    <div className="chat-meta">
                      <span>{message.sender?.name || "User"}</span>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{message.text}</p>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message"
                maxLength={1000}
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}

        <div className="chat-back">
          <Link to="/seller-dashboard">Seller Dashboard</Link>
          <Link to="/profile">Profile</Link>
        </div>
      </div>
    </div>
  );
}
