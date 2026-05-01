import { useEffect, useState, useRef } from "react";
import Search from "../components/Search";
import Results from "../components/Results";
import Library from "../pages/Library";
const API = import.meta.env.VITE_API_URL;

export default function Home() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [activeTab, setActiveTab] = useState("search");

    const [playlists, setPlaylists] = useState([]);
    const [library, setLibrary] = useState([]);
    const [aiPlaylists, setAiPlaylists] = useState([]);

    const audioRef = useRef(null);

    const [currentPreview, setCurrentPreview] = useState(null);

    useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
        localStorage.setItem("token", token);
        window.history.replaceState({}, document.title, "/");
        setIsLoggedIn(true);
    }
}, []);

    

    useEffect(() => {
    fetch(`${API}/api/me`, {
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
})
        .then(res => {
            if (res.ok) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        })
        .catch(err => {
            console.error("Auth check failed:", err);
            setIsLoggedIn(false);
        });
}, []);

    async function handleSearch(query) {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const data = await res.json();
            setTracks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) return res.status(401).json({ error: "No token" });

    try {
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.accessToken = decoded.accessToken;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
}

    function playPreview(url) {
        if (!url) return;

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
        setCurrentPreview(url);
    }

    async function handleLogout() {
        try {
            await fetch(`${API}/auth/logout`, {
                method: "POST",
                credentials: "include"
            });

            setIsLoggedIn(false);
            setTracks([]);
            setPlaylists([]);
            setLibrary([]);
            setAiPlaylists([]);
        } catch (err) {
            console.error("Logout failed", err);
        }
    }

    async function loadPlaylists() {
        try {
            const res = await fetch(`${API}/api/playlists`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            setPlaylists(data);
        } catch (err) { console.error(err); }
    }

    async function loadLibrary() {
        try {
            const res = await fetch(`${API}/api/library`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            setLibrary(data);
        } catch (err) { console.error(err); }
    }

    async function loadAiPlaylists() {
        try {
            const res = await fetch(`${API}/api/ai-playlists`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            setAiPlaylists(data);
        } catch (err) { console.error(err); }
    }

    useEffect(() => {
        if (!isLoggedIn) return;

        if (activeTab === "playlists") loadPlaylists();
        if (activeTab === "library") loadLibrary();
        if (activeTab === "ai") loadAiPlaylists();
    }, [activeTab, isLoggedIn]);

    if (!isLoggedIn) {
        return (
            <div style={styles.loginContainer}>
                <h1 style={styles.logo}>Spotify Clone</h1>
                <p style={styles.subtitle}>Connect to your music</p>
               <a href={`${API}/auth/login`}>
                    <button style={styles.loginButton}>Login with Spotify</button>
                </a>
            </div>
        );
    }

    const TabButton = ({ label, tab }) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                ...styles.tab,
                backgroundColor: activeTab === tab ? "#1DB954" : "transparent",
                color: activeTab === tab ? "#000" : "#fff",
                transform: activeTab === tab ? "scale(1.05)" : "scale(1)",
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={styles.app}>

            <div style={styles.header}>
                <h2 style={styles.logoSmall}>Spotify Clone</h2>
                <button style={styles.logoutButton} onClick={handleLogout}>
                    Log out
                </button>
            </div>

            <div style={styles.tabBar}>
                <TabButton label="Search" tab="search" />
                <TabButton label="Playlists" tab="playlists" />
                <TabButton label="Library" tab="library" />
                <TabButton label="AI Mix" tab="ai" />
            </div>

            <div style={styles.content}>

                {activeTab === "search" && (
                    <>
                        <Search onSearch={handleSearch} />
                        {loading && <p style={styles.text}>Loading...</p>}

                        {/* Custom Results with preview playback */}
                        <div style={styles.resultsGrid}>
                            {tracks.map(track => (
                                <div key={track.id} style={styles.trackCard}>
                                    <img
                                        src={track.album?.images?.[0]?.url}
                                        style={styles.thumbnail}
                                    />

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "bold" }}>
                                            {track.name}
                                        </div>
                                        <div style={{ opacity: 0.7, fontSize: 12 }}>
                                            {track.artists?.[0]?.name}
                                        </div>
                                    </div>

                                    <button
                                        style={styles.playButton}
                                        onClick={() => playPreview(track.preview_url)}
                                        disabled={!track.preview_url}
                                    >
                                        {track.preview_url ? "▶" : "N/A"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === "playlists" && (
                    <div>
                        <h3 style={styles.sectionTitle}>Your Playlists</h3>
                       <div style={styles.playlistGrid}>
    {playlists.map(p => (
        <div key={p.id} style={styles.playlistCard}>
            <img
                src={p.image}
                alt={p.name}
                style={styles.playlistImg}
            />

            <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: "bold" }}>
                    {p.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {p.tracks} songs
                </div>
            </div>
        </div>
    ))}
</div>
                    </div>
                )}

               {activeTab === "library" && (
    <Library />
                                        )}

                {activeTab === "ai" && (
                    <div>
                        <h3 style={styles.sectionTitle}>AI Playlists</h3>
                        {aiPlaylists.map(p => (
                            <div key={p.id} style={styles.card}>{p.name}</div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}

const styles = {

    playlistGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px"
},

playlistCard: {
    background: "#181818",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "0.2s",
},

playlistImg: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    borderRadius: "8px",
    background: "#333"
}, 
    app: {
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "20px"
    },
    header: {
        marginBottom: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    logoSmall: { color: "#1DB954" },
    logoutButton: {
        backgroundColor: "transparent",
        border: "1px solid #1DB954",
        color: "#1DB954",
        padding: "6px 12px",
        borderRadius: "20px",
        cursor: "pointer"
    },
    tabBar: {
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        borderBottom: "1px solid #333",
        paddingBottom: "10px"
    },
    tab: {
        padding: "10px 16px",
        borderRadius: "20px",
        border: "1px solid #1DB954",
        backgroundColor: "transparent",
        color: "white",
        cursor: "pointer"
    },
    content: { padding: "10px" },
    sectionTitle: { color: "#1DB954" },
    text: { opacity: 0.7 },

    resultsGrid: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "10px"
    },

    trackCard: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        backgroundColor: "#181818",
        padding: "8px",
        borderRadius: "8px",
        border: "1px solid #282828"
    },

    thumbnail: {
        width: "40px",
        height: "40px",
        borderRadius: "4px"
    },

    playButton: {
        backgroundColor: "#1DB954",
        border: "none",
        borderRadius: "50%",
        width: "30px",
        height: "30px",
        cursor: "pointer"
    }
};