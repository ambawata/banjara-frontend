// src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Send,
  Plus,
  Loader2,
  Paperclip,
  Mic,
  Menu,
} from "lucide-react";

const API_BASE_URL = "https://banjara-gpt.onrender.com";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("chat");
  const messagesEndRef = useRef(null);

  const [listingImage, setListingImage] = useState(null);
  const [listingResult, setListingResult] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}`).catch(console.error);
    fetchChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChats = async () => {
    const res = await axios.get(`${API_BASE_URL}/chats`);
    setHistory(res.data);
    if (res.data.length > 0) loadChat(res.data[0].id);
  };

  const loadChat = async (chatId) => {
    const res = await axios.get(`${API_BASE_URL}/chat/${chatId}`);
    setMessages(res.data.messages);
    setCurrentChat(chatId);
    setTab("chat");
  };

  const newChat = async () => {
    const res = await axios.post(`${API_BASE_URL}/chat/new`);
    setHistory([res.data, ...history]);
    setMessages([]);
    setCurrentChat(res.data.id);
    setTab("chat");
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const updated = [...messages, { sender: "user", text: input }];
    setMessages(updated);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/chat/${currentChat}`, {
        message: input,
      });
      setMessages([...updated, { sender: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages([
        ...updated,
        { sender: "bot", text: "Error: " + (err.response?.data?.error || err.message) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentChat) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: `📎 Uploaded: ${file.name}`, file, isUploading: true },
    ]);
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/chat/${currentChat}/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const botMsg = { sender: "bot", text: res.data.reply };
      if (res.data.previewUrl) botMsg.previewUrl = res.data.previewUrl;
      setMessages((prev) =>
        prev.map((m) => (m.isUploading ? null : m)).filter(Boolean).concat(botMsg)
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.isUploading ? null : m)).filter(Boolean).concat({
          sender: "bot",
          text: "Upload failed: " + (err.response?.data?.error || err.message),
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleListingImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setListingImage({
      preview: URL.createObjectURL(file),
    });
    setListingResult("");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE_URL}/upload-listing-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setListingResult(res.data.listing);
    } catch (err) {
      setListingResult("❌ Failed to analyze image: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex font-sans text-sm text-gray-900 bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-lg font-semibold">BanjaraGPT</h1>
          <Menu className="w-5 h-5 text-gray-500" />
        </div>
        <div className="px-4">
          <button
            onClick={newChat}
            className="flex items-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mb-4"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <button
            onClick={() => setTab("listing")}
            className={`mb-2 px-3 py-2 rounded-lg text-left text-sm truncate transition ${
              tab === "listing" ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"
            }`}
          >
            📸 Image to Listing
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="text-xs text-gray-500 uppercase mb-2">Chats</div>
          {history.map((chat) => (
            <div
              key={chat.id}
              onClick={() => loadChat(chat.id)}
              className={`mb-2 px-3 py-2 rounded-lg cursor-pointer text-sm truncate transition ${
                chat.id === currentChat
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-100"
              }`}
            >
              {chat.title || chat.id.slice(-5)}
            </div>
          ))}
        </div>
        <div className="border-t p-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            V
          </div>
          <span className="text-sm font-medium">vinod</span>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col">
        {tab === "chat" ? (
          <>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h2 className="text-2xl font-semibold mb-2">BanjaraGPT</h2>
                  <p className="text-gray-600 mb-4">Upload a file or try a suggested prompt</p>
                  <div className="grid grid-cols-2 gap-4 max-w-xl">
                    {[
                      "Summarize a PDF",
                      "Write product description",
                      "Translate text",
                      "Answer questions about invoice",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="bg-white border border-gray-300 rounded-xl px-4 py-3 hover:bg-gray-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-3xl px-4 py-3 rounded-xl my-2 whitespace-pre-wrap ${
                    msg.sender === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
                  }`}
                >
                  {msg.previewUrl && (
                    <img
                      src={msg.previewUrl}
                      alt="uploaded-preview"
                      className="max-w-xs mb-2 rounded-md"
                    />
                  )}
                  <div>{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div className="bg-gray-200 px-4 py-3 rounded-xl inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing file...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end gap-2 bg-gray-50 border rounded-full px-4 py-2">
                <label className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer">
                  <Paperclip className="w-5 h-5" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.png,.jpg,.jpeg"
                  />
                </label>
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message BanjaraGPT..."
                  className="flex-1 resize-none bg-transparent px-2 py-1 focus:outline-none"
                />
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={loading || !currentChat}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          // Image to Listing Tab
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Upload Product Image</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleListingImageUpload}
              className="block border p-2 rounded"
            />
            {listingImage && (
              <img
                src={listingImage.preview}
                alt="Preview"
                className="max-w-xs rounded-md border"
              />
            )}
            {listingResult && (
              <div className="bg-white border p-4 rounded-xl shadow">
                <pre className="whitespace-pre-wrap">{listingResult}</pre>
              </div>
            )}
            {loading && (
              <div className="text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin inline" /> Processing image...
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}