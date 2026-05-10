import { useEffect, useState, useRef } from 'react';
import { Search as SearchIcon, MessageSquare, Send, Plus, User, Menu, X, ArrowRight, ShieldCheck, Code, Settings, Link as LinkIcon, Camera, Check, Compass, Heart, Trash2, Users, Bell } from 'lucide-react';
import CanvasDots from './CanvasDots';
import { db, storage, auth } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : '';
console.log('Natively verified API Base:', API_BASE_URL);
const apiUrl = (path) => `${API_BASE_URL}${path}`;
const logRequestError = (context, error) => {
  console.error(context, error);
};

const VerifiedBadge = () => (
  <span className="verified-badge-small" title="Natively Verified Engineer">
    <Check size={10} strokeWidth={4} />
  </span>
);

// ==========================================
// AI ASSISTANT BOT WIDGET
// ==========================================
const AIBotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I am the Techgram Assistant. How can I help clarify things for you today?", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInput("");

    const targetUrl = apiUrl('/api/ai/chat');
    try {
      // Step 1: Try to reach the Python Backend (Local or Render)
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      
      if (!resp.ok) throw new Error("Backend Offline");

      const data = await resp.json();
      setMessages(prev => [...prev, { text: data.response, isBot: true }]);
    } catch (err) {
      // Step 2: Live Site Fallback - Direct Neural Link to Gemini
      console.log("Switching to Direct Neural Link fallback...");
      
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || ""; // User should add this to .env
      
      if (!GEMINI_KEY) {
        const errorMsg = "Neural Link Offline: I am unable to reach the Python Backend, and no 'VITE_GEMINI_KEY' was found for a Direct Link. Please ensure your backend is running or add your Gemini Key to .env.";
        setMessages(prev => [...prev, { text: errorMsg, isBot: true }]);
        return;
      }

      try {
        const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are the Techgram AI Assistant. Techgram is an engineering showcase platform. User asks: ${userMessage}` }] }]
          })
        });
        const geminiData = await geminiResp.json();
        const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Please check your Neural Link configuration.";
        setMessages(prev => [...prev, { text: aiText, isBot: true }]);
      } catch (geminiErr) {
        setMessages(prev => [...prev, { text: "Total Connection Failure. All neural pathways are currently offline.", isBot: true }]);
      }
    }
  };

  return (
    <div className={`ai-bot-widget ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="ai-bot-trigger" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
        </button>
      )}
      {isOpen && (
        <div className="ai-bot-window">
          <div className="ai-bot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} /> Techgram AI
            </div>
            <button className="ai-bot-close" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="ai-bot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message ${msg.isBot ? 'bot' : 'user'}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form className="ai-bot-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask about Techgram..." 
              value={input} 
              onChange={e => setInput(e.target.value)} 
            />
            <button type="submit"><Send size={18} /></button>
          </form>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SEPARATE PAGE COMPONENTS
// ==========================================

const ActiveCommunityView = ({ communityName, authId, setActiveCommunity }) => {
  const [feed, setFeed] = useState([]);
  const [message, setMessage] = useState('');
  const [viewType, setViewType] = useState('chat'); // 'chat' or 'posts'

  // Sync Feed (Messages and Posts) from Firestore
  useEffect(() => {
    const q = query(collection(db, "communities", communityName, "feed"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFeed(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [communityName]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await addDoc(collection(db, "communities", communityName, "feed"), {
      sender_auth: authId,
      content: message,
      is_post: false,
      timestamp: serverTimestamp()
    });
    setMessage('');
  };

  const publishPost = async (e) => {
    e.preventDefault();
    if (!message.trim()) return; // Re-using message state or separate postText
    // Logic for posts...
  };

  const chats = feed.filter(f => !f.is_post);
  const posts = feed.filter(f => f.is_post);

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="main-header space-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ color: 'cyan' }}>{communityName}</h1>
          <p className="subtitle">Secure Internal Guild Communications.</p>
        </div>
        <button onClick={() => setActiveCommunity(null)} style={{ background: '#ffffff', color: '#000000', padding: '10px 20px', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leave Interface</button>
      </header>

      <div className="profiler-tabs" style={{ marginBottom: '20px' }}>
        <div className={`profiler-tab ${viewType === 'chat' ? 'active-tab' : ''}`} onClick={() => setViewType('chat')}>LIVE GROUP CHAT</div>
        <div className={`profiler-tab ${viewType === 'posts' ? 'active-tab' : ''}`} onClick={() => setViewType('posts')}>PRIVATE POSTS</div>
      </div>

      {viewType === 'chat' ? (
        <div className="chat-interface-distinct" style={{ fontFamily: 'Arial, sans-serif', background: '#ffffff', borderRadius: '15px', border: '2px solid cyan', padding: '15px', height: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0, 242, 254, 0.2)' }}>
          <div className="chat-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>
            {communityName} - Secure Live Chat
          </div>
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', padding: '10px' }}>
            {chats.map(c => (
              <div key={c.id} style={{
                fontFamily: 'Arial, sans-serif',
                alignSelf: c.sender_auth === authId ? 'flex-end' : 'flex-start',
                background: c.sender_auth === authId ? '#00f2fe' : '#f1f5f9',
                color: c.sender_auth === authId ? '#ffffff' : '#334155',
                padding: '12px 18px',
                borderRadius: c.sender_auth === authId ? '15px 15px 0 15px' : '15px 15px 15px 0',
                margin: '8px 0',
                maxWidth: '75%',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}>
                <small style={{ display: 'block', fontSize: '0.75rem', opacity: 0.8, marginBottom: '5px' }}>{c.sender_auth}</small>
                <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.4' }}>{c.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." style={{ flex: 1, fontFamily: 'Arial, sans-serif', padding: '12px 15px', borderRadius: '25px', border: '1px solid #cbd5e1', outline: 'none', marginRight: '10px', fontSize: '1rem', color: '#333' }} />
            <button type="submit" style={{ background: '#00f2fe', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)' }}><Send size={20} /></button>
          </form>
        </div>
      ) : (
        <div className="posts-interface">
          {/* Posts logic here */}
        </div>
      )}
    </div>
  );
};

const ChatPage = ({ authId, activeChat, setActiveChat }) => {
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => doc.data().authId || doc.data().auth_id).filter(id => id && id !== authId);
      setContacts([...new Set(allUsers)]);
    });
    return () => unsubscribe();
  }, [authId]);

  useEffect(() => {
    if (!activeChat) return;
    const chatId = [authId, activeChat].sort().join("_");
    const q = query(collection(db, "dms", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [activeChat, authId]);

  const sendDM = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const chatId = [authId, activeChat].sort().join("_");
    await addDoc(collection(db, "dms", chatId, "messages"), {
      sender_auth: authId,
      content: text,
      timestamp: serverTimestamp()
    });
    setText('');
  };

  return (
    <div className="page-container dm-page">
      <div className="dm-sidebar">
        <h3>Cloud Connections</h3>
        {contacts.map(c => (
          <div key={c} className={`contact-item ${activeChat === c ? 'active' : ''}`} onClick={() => setActiveChat(c)}>
            <User size={20} /> {c}
          </div>
        ))}
      </div>
      <div className="dm-main">
        {activeChat ? (
          <>
            <div className="dm-header">{activeChat}</div>
            <div className="dm-messages">
              {messages.map(m => (
                <div key={m.id} className={`dm-bubble ${m.sender_auth === authId ? 'sent' : 'received'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <form onSubmit={sendDM} className="dm-input">
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Secure transmission..." />
              <button type="submit"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="dm-empty">Select a contact to begin transmission.</div>
        )}
      </div>
    </div>
  );
};

const HomePage = ({ projects, authId, destroyDeployment, setIsCreating, dispatchFollow }) => {
  const [followedTargets, setFollowedTargets] = useState(new Set());

  const executeFollow = (proj) => {
    const t = proj.contact_email || proj.contact_phone;
    setFollowedTargets(prev => new Set(prev).add(t));
    dispatchFollow(proj);
  };

  return (
    <>
      <header className="main-header space-between">
        <div>
          <div className="top-brand">Techgram Showcase</div>
          <p className="subtitle">Discover state-of-the-art engineering and software deployments.</p>
        </div>
        <button className="primary-action-btn" onClick={() => setIsCreating(true)}>
          <Plus size={20} /> Deploy Project
        </button>
      </header>

      <div className="feed-grid">
        {projects.length === 0 ? (
          <div className="empty-state mock-glass-card">No projects discovered yet. Be the first to deploy!</div>
        ) : (
          projects.map(proj => (
            <div key={proj.id} className="feed-card insta-card">
              <div className="insta-header">
                <div className="insta-profile-pic">
                  <User size={20} color="white" />
                </div>
                <div className="insta-user-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <strong>{proj.owner_username || proj.contact_email || proj.contact_phone}</strong>
                    {proj.is_verified && <VerifiedBadge />}
                  </div>
                  <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                </div>
                <span className={`badge ${proj.category} ml-auto`}>{proj.category.toUpperCase()}</span>
                {(proj.contact_phone !== authId && proj.contact_email !== authId) ? (
                  <button
                    className={`follow-action-btn ${followedTargets.has(proj.contact_email || proj.contact_phone) ? 'following-state' : ''}`}
                    onClick={() => !followedTargets.has(proj.contact_email || proj.contact_phone) && executeFollow(proj)}
                  >
                    {followedTargets.has(proj.contact_email || proj.contact_phone) ? 'Following' : 'Follow'}
                  </button>
                ) : (
                  <button className="del-btn-icon" onClick={() => destroyDeployment(proj.id)} title="Purge Deployment">
                    <Trash2 size={22} color="#dc2743" />
                  </button>
                )}
              </div>

              {proj.media_url && (
                proj.media_url.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                  <video src={proj.media_url} autoPlay loop muted controls className="insta-media" />
                ) : (
                  <img src={proj.media_url} alt="Media" className="insta-media" />
                )
              )}
              {!proj.media_url && proj.category === 'mechanical' && proj.video_url && proj.video_url.match(/\.(mp4|webm|mov)$/i) && (
                <video src={proj.video_url} autoPlay loop muted controls className="insta-media" />
              )}

              <div className="insta-actions">
                <a href="#"><Heart size={26} /></a>
                {proj.category === 'software' && (
                  <>
                    {proj.github_link && <a href={proj.github_link} title="View Source" target="_blank" rel="noreferrer"><Code size={26} /></a>}
                    {proj.preview_link && <a href={proj.preview_link} title="Live Website" target="_blank" rel="noreferrer"><LinkIcon size={26} /></a>}
                  </>
                )}
                {proj.category === 'mechanical' && (
                  <>
                    {proj.video_url && !proj.video_url.match(/\.(mp4|webm)$/i) && <a href={proj.video_url} title="Video Demo" target="_blank" rel="noreferrer"><Camera size={26} /></a>}
                    {proj.model_3d_url && <a href={proj.model_3d_url} title="3D Model" target="_blank" rel="noreferrer"><Settings size={26} /></a>}
                  </>
                )}
              </div>

              <div className="insta-details">
                <p><strong>{proj.title}</strong></p>
                <p>{proj.details}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

const SearchPage = ({ authId, onMessageUser }) => {
  const [filter, setFilter] = useState('accounts');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followed, setFollowed] = useState(new Set());
  const trimmedQuery = query.trim();

  const handleQueryChange = (event) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      setResults([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!trimmedQuery) return;
    const q = query(collection(db, "users"), where("username", ">=", trimmedQuery.toLowerCase()), where("username", "<=", trimmedQuery.toLowerCase() + '\uf8ff'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResults(snapshot.docs.map(doc => ({ auth_id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [trimmedQuery]);

  const handleFollow = async (user) => {
    setFollowed(prev => new Set(prev).add(user.auth_id));
    await addDoc(collection(db, "interactions"), {
      type: 'follow_user',
      sender_auth: authId,
      recipient_auth: user.auth_id,
      target_name: user.username,
      status: 'accepted',
      createdAt: serverTimestamp()
    });
  };

  return (
    <div className="page-container">
      <header className="main-header">
        <h1 className="page-title">Search</h1>
        <p className="subtitle">Find accounts, projects and communities.</p>
      </header>

      <div className="search-bar-container">
        <SearchIcon className="search-icon-inside" size={24} />
        <input
          type="text"
          className="core-input master-search"
          placeholder="Search by @username or email..."
          value={query}
          onChange={handleQueryChange}
          autoComplete="off"
        />
      </div>

      <div className="search-filters">
        <button className={`filter-btn ${filter === 'accounts' ? 'active' : ''}`} onClick={() => setFilter('accounts')}>Accounts</button>
        <button className={`filter-btn ${filter === 'projects' ? 'active' : ''}`} onClick={() => setFilter('projects')}>Projects</button>
        <button className={`filter-btn ${filter === 'community' ? 'active' : ''}`} onClick={() => setFilter('community')}>Communities</button>
      </div>

      {filter === 'accounts' && (
        <div className="search-results-list">
          {loading && <div className="search-empty-state"><p>Searching...</p></div>}
          {!loading && query && results.length === 0 && (
            <div className="search-empty-state"><User size={40} style={{ opacity: 0.2 }} /><p>No accounts found for "{query}"</p></div>
          )}
          {!loading && !query && (
            <div className="search-empty-state"><SearchIcon size={40} style={{ opacity: 0.2 }} /><p>Type to search for accounts</p></div>
          )}
          {results.filter(u => u.auth_id !== authId).map(user => (
            <div key={user.auth_id} className="search-account-row">
              <div className="search-account-avatar">
                <User size={22} color="white" />
              </div>
              <div className="search-account-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <strong>@{user.username}</strong>
                  {user.is_verified && <VerifiedBadge />}
                </div>
                <span>{user.auth_id}</span>
              </div>
              {followed.has(user.auth_id) ? (
                <button className="follow-action-btn following-state" disabled>Following</button>
              ) : (
                <button className="follow-action-btn" onClick={() => handleFollow(user)}>Follow</button>
              )}
              <button className="follow-action-btn" onClick={() => onMessageUser(user.auth_id)} style={{ background: '#00f2fe', color: 'white' }}>Message</button>
            </div>
          ))}
        </div>
      )}

      {filter !== 'accounts' && (
        <div className="search-empty-state">
          <SearchIcon size={40} style={{ opacity: 0.2 }} />
          <p>Search for {filter} coming soon.</p>
        </div>
      )}
    </div>
  );
};

// Real-time Chat and DMs are now handled via the Cloud Neural Stream in the components below.

const CommunityPage = ({ communities, authId, fetchCommunities, deleteCommunity, myMemberships, setActiveCommunity }) => {
  const handleCreate = async () => {
    const name = window.prompt("Designate your secure Engineering Community Name:");
    if (!name) return;
    await addDoc(collection(db, "communities"), {
      name,
      admin_auth: authId,
      createdAt: serverTimestamp()
    });
  };

  const handleJoin = async (c) => {
    if (c.admin_auth === authId) return alert("System Analysis: You officially act as the core administrator here.");
    await addDoc(collection(db, "interactions"), {
      type: 'join_community',
      sender_auth: authId,
      recipient_auth: c.admin_auth,
      target_name: c.name,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    alert(`Authorization petition dispatched to ${c.admin_auth}.`);
  };

  return (
    <div className="page-container">
      <header className="main-header space-between">
        <div>
          <h1 className="page-title">Engineering Guilds</h1>
          <p className="subtitle">Integrate natively securely into hardware and software communities worldwide.</p>
        </div>
        <button className="primary-action-btn" onClick={handleCreate}>+ Deploy Guild</button>
      </header>
      <div className="community-grid">
        {communities.map(c => (
          <div key={c.id} className="community-card mock-glass-card">
            <div style={{ background: "rgba(42, 52, 57, 0.1)", padding: "16px", borderRadius: "50%" }}>
              <Users size={32} color="var(--charcoal-black)" />
            </div>
            <h3 style={{ color: 'cyan' }}>{c.name}</h3>
            {c.admin_auth === authId ? (
              <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                <button className="enter-community-btn" onClick={() => setActiveCommunity(c.name)}>Enter Community</button>
                <button className="del-btn-icon" style={{ margin: 0, padding: '10px', background: 'rgba(220,38,38,0.1)' }} onClick={() => deleteCommunity(c.id)} title="Purge Guild"><Trash2 size={24} color="#dc2626" /></button>
              </div>
            ) : myMemberships.includes(c.name) ? (
              <button className="enter-community-btn" onClick={() => setActiveCommunity(c.name)}>Enter Community</button>
            ) : (
              <button className="join-btn" onClick={() => handleJoin(c)}>Request Verification</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
};

const ProfilePage = ({ authId, sessionUsername, projects, userStats, onLogout, onUpdateProfilePic }) => {
  const userProjects = projects.filter(p => p.contact_email === authId || p.contact_phone === authId);
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => fileInputRef.current.click();

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('auth_id', authId);
    formData.append('file', file);

    try {
      const resp = await fetch('/api/user/profile-pic', { method: 'POST', body: formData });
      const data = await resp.json();
      if (resp.ok) {
        onUpdateProfilePic(data.url);
      }
    } catch (err) {
      console.error("Avatar sync failed natively.", err);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={onFileChange} />
      <header className="insta-profile-header">
        <div className="profiler-avatar-container">
          <div className="profiler-avatar-ring" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
            {userStats.profile_pic_url ? (
              <img src={userStats.profile_pic_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={65} color="#64748b" />
            )}
          </div>
        </div>

        <div className="profiler-details-container">
          <div className="profiler-top-row">
            <h2 className="profiler-username">@{sessionUsername || 'architect'}</h2>
            <button className="profiler-edit-btn">Edit Profile</button>
            <button className="profiler-edit-btn" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Settings size={18} /> Logout
            </button>
          </div>

          <div className="profiler-stats-row">
            <span><strong>{userProjects.length}</strong> deployments</span>
            <span><strong>{userStats.followers}</strong> followers</span>
            <span><strong>{userStats.following}</strong> following</span>
          </div>

          <div className="profiler-bio-section">
            <strong>Techgram Architect</strong>
            <p>Building secure native physics UI infrastructure seamlessly.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0' }}>Secured locally via: {authId}</p>
            <a href="#">github.com/{sessionUsername || 'architect'}</a>
          </div>
        </div>
      </header>

      <div className="profiler-tabs">
        <div className="profiler-tab active-tab"><Compass size={18} /> DEPLOYMENTS</div>
        <div className="profiler-tab"><Camera size={18} /> MEDIA</div>
        <div className="profiler-tab"><Code size={18} /> SAVED</div>
      </div>

      <div className="profiler-grid">
        {userProjects.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '50px', textAlign: 'center', color: '#64748b' }}>
            <Camera size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
            <h2>No Deployments Captured Yet</h2>
          </div>
        ) : (
          userProjects.map(proj => (
            <div key={proj.id} className="profiler-grid-item">
              {proj.media_url ? (
                proj.media_url.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                  <video src={proj.media_url} muted loop />
                ) : (
                  <img src={proj.media_url} alt="Project Media" />
                )
              ) : (
                <div className="profiler-no-media">
                  <Settings size={32} color="#94a3b8" />
                  <span style={{ fontSize: '0.85rem' }}>{proj.title}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const NotificationsPage = ({ notifications, fetchNotifications }) => {
  const handleResolve = async (id, status) => {
    await fetch(apiUrl(`/api/interactions/${id}`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchNotifications(); // Reload list
  }

  return (
    <div className="page-container">
      <header className="main-header">
        <h1 className="page-title">Security Petitions</h1>
        <p className="subtitle">Systemively globally manage inherently incoming clearance protocols natively.</p>
      </header>
      <div className="feed-grid">
        {notifications.length === 0 ? <div className="empty-state mock-glass-card">Database returning zero operational intelligence requests pending inherently.</div> :
          notifications.map(n => (
            <div key={n.id} className="feed-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: "var(--text-primary)" }}>
                <strong>{n.sender_auth}</strong>
                <span> legitimately requested strict security clearance tracking accessing </span>
                <strong>{n.target_name}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="join-btn" onClick={() => handleResolve(n.id, 'accepted')} style={{ background: '#16a34a' }}>Approve</button>
                <button className="join-btn" onClick={() => handleResolve(n.id, 'rejected')} style={{ background: '#dc2626' }}>Decline</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
};

// ==========================================
// MAIN APP ARCHITECTURE
// ==========================================

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashClass, setSplashClass] = useState('');
  const [activeTab, setActiveTab] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Security + Auth System States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authId, setAuthId] = useState('');
  const [username, setUsername] = useState(''); // NEW USERNAME TRACKING SYSTEM natively inherently dynamically tracking
  const [sessionUsername, setSessionUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedAuthId = localStorage.getItem('techgram_authId');
    const storedUsername = localStorage.getItem('techgram_username');
    if (storedAuthId && storedUsername) {
      setAuthId(storedAuthId);
      setSessionUsername(storedUsername);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('techgram_authId');
    localStorage.removeItem('techgram_username');
    setIsLoggedIn(false);
    setAuthId('');
    setSessionUsername('');
    setUsername('');
    setOtpSent(false);
    setOtp('');
  };

  const [projects, setProjects] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [activeGlobalChat, setActiveGlobalChat] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState({ followers: 0, following: 0 });
  const [myMemberships, setMyMemberships] = useState([]);

  const [isCreating, setIsCreating] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [form, setForm] = useState({
    title: '', category: 'software', details: '', contactPhone: '', contactEmail: '',
    emailVerified: false, phoneVerified: false, githubLink: '', previewLink: '', videoUrl: '', model3dUrl: ''
  });

  const navItems = [
    { name: 'Home', icon: Compass },
    { name: 'Search', icon: SearchIcon },
    { name: 'Chats', icon: MessageSquare },
    { name: 'Community', icon: Users },
    { name: 'Notifications', icon: Bell },
    { name: 'Profile', icon: User },
  ];

  // --- Cloud Neural Feed (Firestore Real-time) ---
  useEffect(() => {
    if (!isLoggedIn) return;
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to readable date if needed
        created_at: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
      }));
      setProjects(cloudProjects);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  const fetchProjects = () => {
    // No longer needed as we use real-time listeners
  };

  // --- Cloud Community Listener ---
  useEffect(() => {
    if (!isLoggedIn) return;
    const q = query(collection(db, "communities"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [isLoggedIn]);

  const fetchCommunities = () => {};

  // --- Cloud Notifications Listener ---
  useEffect(() => {
    if (!isLoggedIn || !authId) return;
    const q = query(collection(db, "interactions"), where("recipient_auth", "==", authId), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [isLoggedIn, authId]);

  const fetchNotifications = () => {};

  // --- Cloud Memberships Listener ---
  useEffect(() => {
    if (!isLoggedIn || !authId) return;
    const q = query(
      collection(db, "interactions"),
      where("sender_auth", "==", authId),
      where("type", "==", "join_community"),
      where("status", "==", "accepted")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberOf = snapshot.docs.map(doc => doc.data().target_name);
      setMyMemberships(memberOf);
    });
    return () => unsubscribe();
  }, [isLoggedIn, authId]);

  const fetchProfileStats = async () => {
    if (!authId) return;
    try {
      const res = await fetch(apiUrl(`/api/user/${authId}/stats`));
      setUserStats(await res.json());
    } catch (error) {
      logRequestError(`Failed to load profile stats for ${authId}`, error);
    }
  };

  const dispatchFollow = async (proj) => {
    const targetAuth = proj.contact_email || proj.contact_phone;
    await fetch(apiUrl('/api/interactions'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'follow_user', sender_auth: authId, recipient_auth: targetAuth, target_name: 'Public Database System', status: 'accepted' })
    });
    fetchProfileStats();
  };

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashClass('splash-fade-out'), 2500);
    const unmountTimer = setTimeout(() => setShowSplash(false), 3000);
    return () => { clearTimeout(fadeTimer); clearTimeout(unmountTimer); };
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const isEmail = authId.includes('@');
      setForm(prev => ({
        ...prev, contactPhone: isEmail ? '' : authId, contactEmail: isEmail ? authId : '',
        emailVerified: isEmail ? true : false, phoneVerified: isEmail ? false : true
      }));
    }
  }, [isLoggedIn, authId]);

  const requestOTP = async (e) => {
    e.preventDefault();
    if (!authId || !username) return alert("Required: Identity sequence.");
    setLoading(true);
    // Cloud Auth Simulation: Check if user exists or create them
    try {
      const devCode = "123456"; // Simplified for the "Live Connection" demo
      setOtpSent(true);
      alert(`[CLOUD AUTH] Your Security Code is: ${devCode}`);
    } catch (error) {
      alert("Cloud connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    if (otp === "123456") {
      setSessionUsername(username);
      setIsLoggedIn(true);
      localStorage.setItem('techgram_authId', authId);
      localStorage.setItem('techgram_username', username);
      // Register user in Firestore
      try {
        await addDoc(collection(db, "users"), { username, authId, createdAt: serverTimestamp() });
      } catch (e) {}
    } else {
      alert("Invalid Security Code.");
    }
    setLoading(false);
  };

  const destroyDeployment = async (projectId) => {
    if (!window.confirm("WARNING: Are you sure you want to permanently erase this secure deployment physically from the servers?")) return;
    try {
      const response = await fetch(apiUrl(`/api/projects/${projectId}`), { method: 'DELETE' });
      if (response.ok) fetchProjects();
    } catch (error) {
      logRequestError(`Failed to delete project ${projectId}`, error);
      alert("System connection lost.");
    }
  }

  const deleteCommunity = async (commId) => {
    if (!window.confirm("Are you sure you want to delete this Guild?")) return;
    try {
      await deleteDoc(doc(db, "communities", commId));
    } catch (error) {
      logRequestError(`Failed to delete community ${commId}`, error);
      alert("Could not delete community.");
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.emailVerified && !form.phoneVerified) return alert("Secure platform natively requires identity verification dynamically explicitly!");
    if (!form.title || !form.details) return alert("Title and robust dynamically tracked explicitly details are natively realistically structurally conditionally explicitly mandatory.");

    setLoading(true);
    try {
      let finalMediaUrl = "";
      
      // Handle Cloud Media Upload
      if (mediaFile) {
        const storageRef = ref(storage, `projects/${Date.now()}_${mediaFile.name}`);
        const uploadResult = await uploadBytes(storageRef, mediaFile);
        finalMediaUrl = await getDownloadURL(uploadResult.ref);
      }

      // Save to Firestore Neural Store
      await addDoc(collection(db, "projects"), {
        ...form,
        media_url: finalMediaUrl,
        owner_username: sessionUsername || "Pioneer",
        owner_auth: authId || "anonymous",
        createdAt: serverTimestamp(),
        is_verified: form.emailVerified || form.phoneVerified
      });

      setIsCreating(false);
      setForm({ ...form, title: '', details: '', githubLink: '', previewLink: '', videoUrl: '', model3dUrl: '' });
      setMediaFile(null);
    } catch (err) {
      console.error("Cloud Publication Error:", err);
      alert("Neural link failed to store project. Check Firebase credentials.");
    } finally {
      setLoading(false);
    }
  };

  const renderActivePage = () => {
    if (activeCommunity) {
      return <ActiveCommunityView communityName={activeCommunity} authId={authId} setActiveCommunity={setActiveCommunity} />;
    }

    switch (activeTab) {
      case 'Home': return <HomePage projects={projects} authId={authId} destroyDeployment={destroyDeployment} setIsCreating={setIsCreating} dispatchFollow={dispatchFollow} />;
      case 'Search': return <SearchPage authId={authId} onMessageUser={(id) => { setActiveGlobalChat(id); setActiveTab('Chats'); }} />;
      case 'Chats': return <ChatPage authId={authId} activeChat={activeGlobalChat} setActiveChat={setActiveGlobalChat} />;
      case 'Community': return <CommunityPage communities={communities} authId={authId} fetchCommunities={fetchCommunities} deleteCommunity={deleteCommunity} myMemberships={myMemberships} setActiveCommunity={setActiveCommunity} />;
      case 'Profile':
        return (
          <ProfilePage 
            authId={authId} 
            sessionUsername={sessionUsername} 
            projects={projects} 
            userStats={userStats} 
            onLogout={handleLogout}
            onUpdateProfilePic={(url) => setUserStats(prev => ({ ...prev, profile_pic_url: url }))}
          />
        );
      case 'Notifications': return <NotificationsPage notifications={notifications} fetchNotifications={fetchNotifications} />;
      default: return <HomePage projects={projects} authId={authId} destroyDeployment={destroyDeployment} setIsCreating={setIsCreating} />;
    }
  };

  return (
    <>
      {showSplash && (
        <div className={`splash-screen ${splashClass}`}>
          <div className="logo-container">
            <svg className="tg-logo-svg" viewBox="0 0 160 80" width="160" height="80">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" />
                  <stop offset="100%" stopColor="#4facfe" />
                </linearGradient>
                <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path 
                className="tg-new-path" 
                d="M 40,40 C 40,20 60,20 70,30 C 80,40 80,40 90,50 C 100,60 120,60 120,40 C 120,20 100,20 90,30 C 80,40 80,40 70,50 C 60,60 40,60 40,40 Z" 
                stroke="url(#logoGrad)" 
                strokeWidth="8" 
                strokeLinecap="round" 
                fill="none" 
                filter="url(#logoGlow)"
              />
            </svg>
            <div className="tg-logo-text-new">TECHGRAM</div>
          </div>
        </div>
      )}
      <div className="layout">
        <CanvasDots />

        {!isLoggedIn ? (
          <div className="login-overlay">
            <form className="login-card ig-style" onSubmit={otpSent ? verifyOTP : requestOTP}>
              <div className="ig-logo-container">
                <div className="ig-logo-text">Techgram</div>
              </div>

              {!otpSent ? (
                <>
                  <p className="login-subtext">Sign up to see photos and videos from your friends.</p>
                  <div className="input-group">
                    <input 
                      type="text" 
                      placeholder="Username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} 
                      className="ig-input" 
                    />
                    <input 
                      type="text" 
                      placeholder="Mobile Number or Email" 
                      value={authId} 
                      onChange={(e) => setAuthId(e.target.value)} 
                      className="ig-input" 
                      autoFocus 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="icon-wrapper ig-otp-icon">
                    <ShieldCheck size={60} strokeWidth={1} />
                  </div>
                  <h2 className="ig-heading">Enter Security Code</h2>
                  <p className="login-subtext" style={{ fontSize: '0.9rem', padding: '0 20px' }}>
                    Enter the 6-digit code we sent to your account to verify your identity.
                  </p>
                  <div className="input-group ig-otp-container">
                    <input 
                      type="text" 
                      placeholder="Security Code" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                      className="ig-input otp-mode" 
                      autoFocus 
                      maxLength={6}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="ig-btn" disabled={loading || (otpSent && otp.length < 6)}>
                {loading ? 'Processing...' : (otpSent ? 'Confirm' : 'Sign Up')}
              </button>

              <div className="ig-divider">
                <div className="line"></div>
                <div className="or">OR</div>
                <div className="line"></div>
              </div>

              {otpSent ? (
                <p className="resend-text ig-resend" onClick={() => { setOtpSent(false); setOtp(''); }}>
                  Didn't get a code? <strong>Go back</strong>
                </p>
              ) : (
                <p className="login-footer-text">
                  By signing up, you agree to our <strong>Terms</strong>, <strong>Privacy Policy</strong> and <strong>Cookies Policy</strong>.
                </p>
              )}
            </form>
          </div>
        ) : (
          <>
            <div className="menu-container">
              <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <nav className={`navigator-box ${isSidebarOpen ? 'open' : ''}`}>
                <div className="nav-items-vertical">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        className={`nav-icon-btn ${activeTab === item.name ? 'active' : ''}`}
                        style={{ '--stagger-delay': `${index * 0.1}s` }}
                        onClick={() => setActiveTab(item.name)}
                        title={item.name}
                      >
                        <div style={{ position: 'relative', display: 'flex' }}>
                          <Icon size={22} color={item.name === 'Notifications' && notifications.length > 0 ? '#dc2626' : 'currentColor'} />
                          {item.name === 'Notifications' && notifications.length > 0 && (
                            <span className="notification-badge" style={{ top: '-8px', right: '-12px' }}>{notifications.length}</span>
                          )}
                        </div>
                        <span className="tooltip">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

            <main className="main-content">
              {renderActivePage()}
            </main>
            <AIBotWidget />

            {isCreating && (
              <div className="modal-overlay">
                <div className="creation-modal">
                  <div className="modal-header">
                    <h2>Architect New Project</h2>
                    <button className="close-btn" onClick={() => setIsCreating(false)}><X size={24} /></button>
                  </div>

                  <form className="modal-body" onSubmit={handlePublish}>
                    <div className="type-selector">
                      <div
                        className={`type-card ${form.category === 'software' ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, category: 'software' })}>
                        <Code size={32} />
                        <span>Software Integration</span>
                      </div>
                      <div
                        className={`type-card ${form.category === 'mechanical' ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, category: 'mechanical' })}>
                        <Settings size={32} />
                        <span>Mechanical / Physical</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Internal Machine Browser (Upload Image/Video)</label>
                      <input
                        className="core-input"
                        type="file"
                        accept="image/*,video/*"
                        onChange={e => setMediaFile(e.target.files[0])}
                      />
                    </div>

                    <div className="form-group">
                      <label>Project Title (Required)</label>
                      <input className="core-input" placeholder="Neural Network V1..." required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label>Technical Details (Required)</label>
                      <textarea className="core-input textarea" required placeholder="Outline specifications and capabilities..." value={form.details} onChange={e => setForm({ ...form, details: e.target.value })}></textarea>
                    </div>

                    {form.category === 'software' ? (
                      <div className="form-row">
                        <div className="form-group flex-1">
                          <label>GitHub Source URL (Required)</label>
                          <input className="core-input" required placeholder="https://github.com/..." value={form.githubLink} onChange={e => setForm({ ...form, githubLink: e.target.value })} />
                        </div>
                        <div className="form-group flex-1">
                          <label>Live Preview Link</label>
                          <input className="core-input" required placeholder="https://demo.app..." value={form.previewLink} onChange={e => setForm({ ...form, previewLink: e.target.value })} />
                        </div>
                      </div>
                    ) : (
                      <div className="form-row">
                        <div className="form-group flex-1">
                          <label>External Video URL (Optional)</label>
                          <input className="core-input" placeholder="YouTube, Vimeo..." value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} />
                        </div>
                        <div className="form-group flex-1">
                          <label>3D Working Model URL (Optional)</label>
                          <input className="core-input" placeholder="Sketchfab, AutoDesk..." value={form.model3dUrl} onChange={e => setForm({ ...form, model3dUrl: e.target.value })} />
                        </div>
                      </div>
                    )}

                    <hr className="divider" />

                    <h4>Author Verified Contact Injection</h4>
                    <div className="form-row contact-row">
                      <div className="form-group flex-1">
                        <label>Active Display Phone</label>
                        <input className="core-input" placeholder="Emergency verification sequence required..." value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
                      </div>
                      <div className="form-group flex-1">
                        <label>Verification Gmail</label>
                        <div className="verify-input-group">
                          <input className="core-input" type="email" placeholder="example@gmail.com" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value, emailVerified: false })} />
                          {!form.emailVerified ? (
                            <button type="button" className="verify-btn" onClick={() => {
                              if (form.contactEmail) {
                                if (!form.contactEmail.toLowerCase().endsWith('@gmail.com')) {
                                  return alert("Invalid Email: System natively explicitly mandates a valid @gmail.com address for authentication tracking protocols.");
                                }
                                setForm({ ...form, emailVerified: true })
                              }
                            }}>Verify</button>
                          ) : (
                            <span className="verified-badge"><Check size={16} /> Verified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="deploy-btn" disabled={loading}>
                      {loading ? 'Transmitting...' : 'Deploy to Global Feed'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;




