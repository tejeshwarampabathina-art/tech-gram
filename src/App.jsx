import { useEffect, useState } from 'react';
import { Search as SearchIcon, MessageSquare, Send, Plus, User, Menu, X, ArrowRight, ShieldCheck, Code, Settings, Link as LinkIcon, Camera, Check, Compass, Heart, Trash2, Users, Bell } from 'lucide-react';
import CanvasDots from './CanvasDots';

const API_BASE_URL = '';
const apiUrl = (path) => `${API_BASE_URL}${path}`;
const logRequestError = (context, error) => {
  console.error(context, error);
};

// ==========================================
// SEPARATE PAGE COMPONENTS
// ==========================================

const ActiveCommunityView = ({ communityName, authId, setActiveCommunity }) => {
  const [feed, setFeed] = useState([]);
  const [message, setMessage] = useState('');
  const [viewType, setViewType] = useState('chat'); // 'chat' or 'posts'

  const [postText, setPostText] = useState('');
  const [postFile, setPostFile] = useState(null);

  const refreshFeed = async () => {
    try {
      const res = await fetch(apiUrl(`/api/community/${communityName}/feed`));
      setFeed(await res.json());
    } catch (error) {
      logRequestError(`Failed to load feed for ${communityName}`, error);
    }
  };

  useEffect(() => {
    let ignore = false;

    const syncFeed = async () => {
      try {
        const res = await fetch(apiUrl(`/api/community/${communityName}/feed`));
        const data = await res.json();
        if (!ignore) {
          setFeed(data);
        }
      } catch (error) {
        logRequestError(`Failed to sync feed for ${communityName}`, error);
      }
    };

    void syncFeed();
    const intv = setInterval(() => {
      void syncFeed();
    }, 3000);

    return () => {
      ignore = true;
      clearInterval(intv);
    };
  }, [communityName]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await fetch(apiUrl(`/api/community/${communityName}/message`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_auth: authId, content: message })
    });
    setMessage('');
    await refreshFeed();
  };

  const publishPost = async (e) => {
    e.preventDefault();
    if (!postText.trim()) return;
    const fd = new FormData();
    fd.append('auth_id', authId);
    fd.append('content', postText);
    if (postFile) fd.append('file', postFile);

    await fetch(apiUrl(`/api/community/${communityName}/post`), {
      method: 'POST', body: fd
    });
    setPostText('');
    setPostFile(null);
    setViewType('posts');
    await refreshFeed();
  };

  const chats = feed.filter(f => !f.is_post);
  const posts = feed.filter(f => f.is_post);

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="main-header space-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">{communityName}</h1>
          <p className="subtitle">Secure Internal Guild Communications.</p>
        </div>
        <button className="del-btn-icon" onClick={() => setActiveCommunity(null)} style={{ background: 'var(--charcoal-black)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700 }}>Leave Interface</button>
      </header>

      <div className="profiler-tabs" style={{ marginTop: 0, marginBottom: '20px' }}>
        <div className={`profiler-tab ${viewType === 'chat' ? 'active-tab' : ''}`} onClick={() => setViewType('chat')}><MessageSquare size={18} /> LIVE GROUP CHAT</div>
        <div className={`profiler-tab ${viewType === 'posts' ? 'active-tab' : ''}`} onClick={() => setViewType('posts')}><Compass size={18} /> PRIVATE POSTS</div>
      </div>

      {viewType === 'chat' ? (
        <div className="chat-interface" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid var(--border-color)', height: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '10px' }}>
            {chats.map(c => (
              <div key={c.id} style={{ alignSelf: c.sender_auth === authId ? 'flex-end' : 'flex-start', background: c.sender_auth === authId ? 'var(--charcoal-black)' : '#e2e8f0', color: c.sender_auth === authId ? 'white' : 'var(--charcoal-black)', padding: '10px 16px', borderRadius: '12px', maxWidth: '80%' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.7, display: 'block', marginBottom: '4px' }}>{c.sender_username || c.sender_auth}</span>
                {c.content}
              </div>
            ))}
            {chats.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 'auto', marginBottom: 'auto' }}>No secure messages originated yet in {communityName}.</div>}
          </div>
          <form onSubmit={sendMessage} style={{ display: 'flex', padding: '15px', borderTop: '1px solid var(--border-color)', background: 'white' }}>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Transmit strictly..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginRight: '10px', outline: 'none' }} required />
            <button type="submit" className="enter-community-btn" style={{ flex: 0, width: '60px', padding: 0 }}><Send size={20} /></button>
          </form>
        </div>
      ) : (
        <div className="private-posts-interface">
          <div className="publish-card" style={{ background: 'rgba(255,255,255,0.8)', padding: '20px', borderRadius: '20px', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '10px' }}>Deploy Private Guild Post</h3>
            <form onSubmit={publishPost}>
              <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="Define structural private parameters exclusively for verification inside this specific Guild..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '80px', marginBottom: '10px', outline: 'none' }} required />
              <input type="file" accept="image/*,video/*" onChange={e => setPostFile(e.target.files[0])} style={{ marginBottom: '10px' }} />
              <button type="submit" className="enter-community-btn" style={{ width: '100%' }}>Deploy Strictly Formally to Guild</button>
            </form>
          </div>

          <div className="feed-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
            {posts.map(p => (
              <div key={p.id} className="insta-card">
                <div className="insta-header">
                  <User size={30} color="#64748b" style={{ background: '#e2e8f0', padding: '4px', borderRadius: '50%' }} />
                  <div className="insta-user-info"><strong>{p.sender_username || p.sender_auth}</strong><span>Guild Private Deployment â€¢ {new Date(p.timestamp).toLocaleDateString()}</span></div>
                </div>
                {p.media_url && (
                  p.media_url.match(/\.(mp4|webm|mov|ogg)$/i) ? (
                    <video className="insta-media" src={p.media_url} controls muted loop />
                  ) : (
                    <img className="insta-media" src={p.media_url} alt="Private Post" />
                  )
                )}
                <div className="insta-actions"><Heart size={24} color="var(--charcoal-black)" /></div>
                <div className="insta-details"><p><strong>{p.sender_username || p.sender_auth}</strong> {p.content}</p></div>
              </div>
            ))}
            {posts.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5 }}>No private secure deployments structurally found.</div>}
          </div>
        </div>
      )}
    </div>
  )
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
                  <strong>{proj.owner_username || proj.contact_email || proj.contact_phone}</strong>
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

const SearchPage = ({ authId }) => {
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

    let ignore = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/search/users?q=${encodeURIComponent(trimmedQuery)}`));
        const data = await res.json();
        if (!ignore) {
          setResults(data);
        }
      } catch (error) {
        if (!ignore) {
          setResults([]);
        }
        logRequestError(`Failed to search for ${trimmedQuery}`, error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }, 350); // debounce 350ms
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [trimmedQuery]);

  const handleFollow = async (user) => {
    setFollowed(prev => new Set(prev).add(user.auth_id));
    await fetch(apiUrl('/api/interactions'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'follow_user', sender_auth: authId,
        recipient_auth: user.auth_id,
        target_name: user.username, status: 'accepted'
      })
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
                <strong>@{user.username}</strong>
                <span>{user.auth_id}</span>
              </div>
              {followed.has(user.auth_id) ? (
                <button className="follow-action-btn following-state" disabled>Following</button>
              ) : (
                <button className="follow-action-btn" onClick={() => handleFollow(user)}>Follow</button>
              )}
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

const ChatPage = ({ authId }) => {
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadContacts = async () => {
      try {
        const res = await fetch(apiUrl(`/api/contacts/${authId}`));
        const data = await res.json();
        if (!ignore) {
          setContacts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        logRequestError(`Failed to load contacts for ${authId}`, error);
      }
    };

    void loadContacts();

    return () => {
      ignore = true;
    };
  }, [authId]);

  const openChat = async (contact) => {
    setActiveChat(contact);
    try {
      const res = await fetch(apiUrl(`/api/dm/${authId}/${contact}`));
      setMessages(await res.json());
    } catch (error) {
      logRequestError(`Failed to load direct messages for ${contact}`, error);
    }
  };

  useEffect(() => {
    if (!activeChat) return;

    let ignore = false;
    const syncChat = async () => {
      try {
        const res = await fetch(apiUrl(`/api/dm/${authId}/${activeChat}`));
        const data = await res.json();
        if (!ignore) {
          setMessages(data);
        }
      } catch (error) {
        logRequestError(`Failed to sync direct messages for ${activeChat}`, error);
      }
    };

    void syncChat();
    const intv = setInterval(() => {
      void syncChat();
    }, 3000);

    return () => {
      ignore = true;
      clearInterval(intv);
    };
  }, [activeChat, authId]);

  const sendDM = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch(apiUrl('/api/dm'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_auth: authId, recipient_auth: activeChat, content: text })
    });
    setText('');
    await openChat(activeChat);
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '20px', height: '70vh' }}>
      <div style={{ flex: '0 0 300px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>Secure Connections</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {contacts.map(c => (
            <div key={c} onClick={() => openChat(c)} style={{ padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', background: activeChat === c ? '#f1f5f9' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s' }}>
              <User size={24} color={activeChat === c ? 'var(--charcoal-black)' : '#94a3b8'} />
              <span style={{ fontWeight: activeChat === c ? 700 : 500, color: 'var(--charcoal-black)' }}>{c}</span>
            </div>
          ))}
          {contacts.length === 0 && <div style={{ padding: '20px', opacity: 0.5, textAlign: 'center' }}>No active verifications. Follow users uniquely globally to explicitly initiate direct links natively.</div>}
        </div>
      </div>

      <div style={{ flex: 1, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--charcoal-black)' }}>
              <User size={24} /> {activeChat}
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', scrollBehavior: 'smooth' }}>
              {messages.map(m => (
                <div key={m.id} style={{ alignSelf: m.sender_auth === authId ? 'flex-end' : 'flex-start', background: m.sender_auth === authId ? 'var(--charcoal-black)' : '#e2e8f0', color: m.sender_auth === authId ? 'white' : 'var(--charcoal-black)', padding: '10px 16px', borderRadius: '12px', maxWidth: '75%' }}>
                  {m.content}
                </div>
              ))}
              {messages.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 'auto', marginBottom: 'auto' }}>Initiate encrypted transmission structurally natively.</div>}
            </div>
            <form onSubmit={sendDM} style={{ display: 'flex', padding: '15px', borderTop: '1px solid var(--border-color)', background: 'white' }}>
              <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Message securely..." style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', marginRight: '10px', outline: 'none' }} />
              <button type="submit" className="enter-community-btn" style={{ flex: 0, width: '60px', padding: 0 }}><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#94a3b8', gap: '10px' }}>
            <MessageSquare size={48} style={{ opacity: 0.3 }} />
            <h2>Direct Messages</h2>
            <p>Select a secure connection explicitly to initiate strictly internally.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CommunityPage = ({ communities, authId, fetchCommunities, deleteCommunity, myMemberships, setActiveCommunity }) => {
  const handleCreate = async () => {
    const name = window.prompt("Designate your secure Engineering Community Name:");
    if (!name) return;
    await fetch(apiUrl('/api/communities'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, admin_auth: authId })
    });
    fetchCommunities(); // Update UI natively explicitly natively
  };

  const handleJoin = async (c) => {
    if (c.admin_auth === authId) return alert("System Analysis: You officially act as the core administrator here globally natively.");
    await fetch(apiUrl('/api/interactions'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'join_community', sender_auth: authId, recipient_auth: c.admin_auth, target_name: c.name })
    });
    alert(`Authorization petition electronically dispatched correctly explicitly to ${c.admin_auth}. Check back for notification clearance natively!`);
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
            <h3>{c.name}</h3>
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

const ProfilePage = ({ authId, sessionUsername, projects, userStats }) => {
  const userProjects = projects.filter(p => p.contact_email === authId || p.contact_phone === authId);
  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <header className="insta-profile-header">
        <div className="profiler-avatar-container">
          <div className="profiler-avatar-ring">
            <User size={65} color="#64748b" />
          </div>
        </div>

        <div className="profiler-details-container">
          <div className="profiler-top-row">
            <h2 className="profiler-username">@{sessionUsername || 'architect'}</h2>
            <button className="profiler-edit-btn">Edit Profile</button>
            <button className="profiler-edit-btn"><Settings size={18} /></button>
          </div>

          <div className="profiler-stats-row">
            <span><strong>{userProjects.length}</strong> deployments</span>
            <span><strong>{userStats.followers}</strong> followers</span>
            <span><strong>{userStats.following}</strong> following</span>
          </div>

          <div className="profiler-bio-section">
            <strong>Techgram Architect</strong>
            <p>Building secure native physics UI infrastructure seamlessly.</p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '4px 0' }}>Secured locally via: {authId}</p>
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

  const [projects, setProjects] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [activeCommunity, setActiveCommunity] = useState(null);
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

  const fetchProjects = async () => {
    try {
      const res = await fetch(apiUrl('/api/projects'));
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (error) {
      logRequestError('Failed to load projects', error);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch(apiUrl('/api/communities'));
      setCommunities(await res.json());
    } catch (error) {
      logRequestError('Failed to load communities', error);
    }
  };

  const fetchNotifications = async () => {
    if (!authId) return;
    try {
      const res = await fetch(apiUrl(`/api/interactions/${authId}`));
      setNotifications(await res.json());
    } catch (error) {
      logRequestError(`Failed to load notifications for ${authId}`, error);
    }
  };

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
      let ignore = false;

      const initializeAppData = async () => {
        try {
          const res = await fetch(apiUrl('/api/projects'));
          const data = await res.json();
          if (!ignore && data.projects) {
            setProjects(data.projects);
          }
        } catch (error) {
          logRequestError('Failed to load projects during login', error);
        }

        try {
          const res = await fetch(apiUrl('/api/communities'));
          const data = await res.json();
          if (!ignore) {
            setCommunities(data);
          }
        } catch (error) {
          logRequestError('Failed to load communities during login', error);
        }

        if (!authId) {
          return;
        }

        try {
          const res = await fetch(apiUrl(`/api/interactions/${authId}`));
          const data = await res.json();
          if (!ignore) {
            setNotifications(data);
          }
        } catch (error) {
          logRequestError(`Failed to load notifications during login for ${authId}`, error);
        }

        try {
          const res = await fetch(apiUrl(`/api/user/${authId}/stats`));
          const data = await res.json();
          if (!ignore) {
            setUserStats(data);
          }
        } catch (error) {
          logRequestError(`Failed to load stats during login for ${authId}`, error);
        }

        try {
          const res = await fetch(apiUrl(`/api/user/${authId}/memberships`));
          const data = await res.json();
          if (!ignore) {
            setMyMemberships(data.communities || []);
          }
        } catch (error) {
          logRequestError(`Failed to load memberships during login for ${authId}`, error);
        }
      };

      void initializeAppData();

      const isEmail = authId.includes('@');
      setForm(prev => ({
        ...prev, contactPhone: isEmail ? '' : authId, contactEmail: isEmail ? authId : '',
        emailVerified: isEmail ? true : false, phoneVerified: isEmail ? false : true
      }));

      return () => {
        ignore = true;
      };
    }
  }, [isLoggedIn, authId]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let ignore = false;
    const pollUserState = async () => {
      try {
        const res = await fetch(apiUrl(`/api/interactions/${authId}`));
        const data = await res.json();
        if (!ignore) {
          setNotifications(data);
        }
      } catch (error) {
        logRequestError(`Failed to refresh notifications for ${authId}`, error);
      }

      try {
        const res = await fetch(apiUrl(`/api/user/${authId}/memberships`));
        const data = await res.json();
        if (!ignore) {
          setMyMemberships(data.communities || []);
        }
      } catch (error) {
        logRequestError(`Failed to refresh memberships for ${authId}`, error);
      }
    };

    const interval = setInterval(() => {
      void pollUserState();
    }, 5000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [isLoggedIn, authId]);

  const requestOTP = async (e) => {
    e.preventDefault();
    if (!authId || !username) return alert("All fields including strict native @username dynamically explicitly required natively.");

    if (authId.includes('@') && !authId.toLowerCase().endsWith('@gmail.com')) {
      return alert("Access Denied: Official Gmail addresses (@gmail.com) are strictly securely the only authorized email format allowed on the platform.");
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/request-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_id: authId, username: username.toLowerCase().replace(/\s/g, '') })
      });
      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        const textRouting = authId.includes('@') ? 'Simulated Email' : 'Simulated SMS';
        alert(`[${textRouting}] Your Techgram Security Code is: ${data.dev_code}`);
      } else {
        alert(data.message); // natively tracks 409 Username Collisions explicitly correctly
      }
    } catch (error) {
      logRequestError('Failed to request OTP', error);
      alert("Error: Backend offline natively.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/verify-otp'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auth_id: authId, otp, username: username })
      });
      const data = await response.json();
      if (response.ok) {
        setSessionUsername(data.username); // Capture exactly uniquely tracked authenticated globally natively string
        setIsLoggedIn(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      logRequestError('Failed to verify OTP', error);
      alert("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
    if (!window.confirm("SYSTEM WARNING: Are you certain you want to permanently eradicate this entire mathematical community architecture natively?")) return;
    try {
      const response = await fetch(apiUrl(`/api/communities/${commId}`), { method: 'DELETE' });
      if (response.ok) fetchCommunities();
    } catch (error) {
      logRequestError(`Failed to delete community ${commId}`, error);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!form.emailVerified && !form.phoneVerified) return alert("Secure platform natively requires identity verification dynamically explicitly!");
    if (!form.title || !form.details) return alert("Title and robust dynamically tracked explicitly details are natively realistically structurally conditionally explicitly mandatory.");

    setLoading(true);
    const apiData = new FormData();
    Object.keys(form).forEach(key => apiData.append(key, form[key]));
    if (mediaFile) apiData.append('mediaFile', mediaFile);

    try {
      const res = await fetch(apiUrl('/api/projects'), { method: 'POST', body: apiData });
      if (res.ok) {
        setIsCreating(false);
        fetchProjects();
        setForm({ ...form, title: '', details: '', githubLink: '', previewLink: '', videoUrl: '', model3dUrl: '' });
        setMediaFile(null);
      }
    } catch (error) {
      logRequestError('Failed to publish project', error);
      alert("Failed to deploy explicitly inherently dynamically to servers natively.");
    }
    setLoading(false);
  };

  const renderActivePage = () => {
    if (activeCommunity) {
      return <ActiveCommunityView communityName={activeCommunity} authId={authId} setActiveCommunity={setActiveCommunity} />;
    }

    switch (activeTab) {
      case 'Home': return <HomePage projects={projects} authId={authId} destroyDeployment={destroyDeployment} setIsCreating={setIsCreating} dispatchFollow={dispatchFollow} />;
      case 'Search': return <SearchPage authId={authId} />;
      case 'Chats': return <ChatPage authId={authId} />;
      case 'Community': return <CommunityPage communities={communities} authId={authId} fetchCommunities={fetchCommunities} deleteCommunity={deleteCommunity} myMemberships={myMemberships} setActiveCommunity={setActiveCommunity} />;
      case 'Profile': return <ProfilePage authId={authId} sessionUsername={sessionUsername} projects={projects} userStats={userStats} />;
      case 'Notifications': return <NotificationsPage notifications={notifications} fetchNotifications={fetchNotifications} />;
      default: return <HomePage projects={projects} authId={authId} destroyDeployment={destroyDeployment} setIsCreating={setIsCreating} />;
    }
  };

  return (
    <>
      {showSplash && (
        <div className={`splash-screen ${splashClass}`}>
          <div className="logo-container">
            <svg className="tg-logo-svg" viewBox="0 0 100 100" width="120" height="120">
              <defs>
                <linearGradient id="tgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path className="tg-path" d="M 15,25 L 85,25 M 50,25 L 50,85" stroke="url(#tgGrad)" strokeWidth="14" strokeLinecap="round" fill="none" filter="url(#glow)" />
              <circle className="tg-dot" cx="50" cy="85" r="7" fill="#2A3439" />
            </svg>
            <div className="tg-logo-text">TECHGRAM</div>
          </div>
        </div>
      )}
      <div className="layout">
        <CanvasDots />

        {!isLoggedIn ? (
          <div className="login-overlay">
            <form className="login-card" onSubmit={otpSent ? verifyOTP : requestOTP}>
              <div className="icon-wrapper">
                <ShieldCheck size={36} className="shield-icon" />
              </div>
              <h2>Unlock Techgram</h2>
              <p className="login-subtext">Requires explicit secure username identity.</p>

              <div className="input-group">
                {!otpSent ? (
                  <>
                    <input type="text" placeholder="Designate public '@username'..." value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} className="auth-input" style={{ marginBottom: '14px' }} />
                    <input type="text" placeholder="Enter Mobile Number or Email..." value={authId} onChange={(e) => setAuthId(e.target.value)} className="auth-input" autoFocus />
                  </>
                ) : (
                  <input type="text" placeholder="Enter secure code..." value={otp} onChange={(e) => setOtp(e.target.value)} className="auth-input otp-mode" autoFocus />
                )}
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Processing...' : (otpSent ? 'Verify Secure Code' : 'Request Authentication Gateway')}
                {!loading && <ArrowRight size={18} />}
              </button>
              {otpSent && (
                <p className="resend-text" onClick={() => { setOtpSent(false); setOtp(''); }}>
                  Need another securely explicit internally inherently code mechanically? Go back.
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




