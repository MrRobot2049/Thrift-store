import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import NavBar from "./NavBar";
import "./chat.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");
const CLOUDINARY_UPLOAD_URL = process.env.REACT_APP_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET;

export default function ChatPage() {
  const { auctionId, purchaseId } = useParams();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isPurchaseChat = Boolean(purchaseId);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketReady, setSocketReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

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

        const endpoint = isPurchaseChat
          ? `${API_BASE_URL}/chats/purchase/${purchaseId}`
          : `${API_BASE_URL}/chats/auction/${auctionId}`;

        const res = await fetch(endpoint, {
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
  }, [auctionId, purchaseId, isPurchaseChat, token]);

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
      if (isPurchaseChat) {
        socket.emit("chat:joinPurchase", { purchaseId });
      } else {
        socket.emit("chat:joinAuction", { auctionId });
      }
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
  }, [auctionId, purchaseId, isPurchaseChat, room, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadImageToCloudinary = async (file) => {
    if (!file) {
      return "";
    }

    if (!CLOUDINARY_UPLOAD_URL || !CLOUDINARY_PRESET) {
      throw new Error("Image upload is not configured");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    const res = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await res.json();
    return data.secure_url || "";
  };

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const clearSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text && !imageFile) {
      return;
    }

    setError("");
    setSending(true);

    try {
      const image = imageFile ? await uploadImageToCloudinary(imageFile) : "";
      const payload = {
        text,
        image,
      };

      if (socketRef.current && socketReady) {
        if (isPurchaseChat) {
          socketRef.current.emit("chat:sendPurchaseMessage", {
            purchaseId,
            ...payload,
          });
        } else {
          socketRef.current.emit("chat:sendMessage", {
            auctionId,
            ...payload,
          });
        }
        setDraft("");
        clearSelectedImage();
        return;
      }

      const endpoint = isPurchaseChat
        ? `${API_BASE_URL}/chats/purchase/${purchaseId}/messages`
        : `${API_BASE_URL}/chats/auction/${auctionId}/messages`;

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setMessages((prev) => [...prev, data]);
      setDraft("");
      clearSelectedImage();
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-page">
      <NavBar />

      <div className="chat-shell">
        <div className="chat-head">
          <div>
            <h1>{isPurchaseChat ? "Purchase Chat" : "Auction Chat"}</h1>
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
                    {message.text ? <p>{message.text}</p> : null}
                    {message.image ? (
                      <a href={message.image} target="_blank" rel="noreferrer" className="chat-image-link">
                        <img src={message.image} alt="Chat attachment" className="chat-image" />
                      </a>
                    ) : null}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
              >
                Image
              </button>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={imageFile ? "Add a caption (optional)" : "Type your message"}
                maxLength={1000}
              />
              <button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
            {imagePreview && (
              <div className="chat-preview-row">
                <img src={imagePreview} alt="Selected" className="chat-preview-image" />
                <button type="button" onClick={clearSelectedImage} className="chat-clear-preview-btn">
                  Remove
                </button>
              </div>
            )}
          </>
        )}

        <div className="chat-back">
          <Link to="/tickets">My Tickets</Link>
          <Link to="/seller-dashboard">Seller Dashboard</Link>
          <Link to="/profile">Profile</Link>
        </div>
      </div>
    </div>
  );
}
