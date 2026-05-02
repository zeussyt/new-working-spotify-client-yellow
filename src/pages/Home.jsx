//WORKING

import { useEffect, useState, useRef } from "react";
import Search from "../components/Search";
import Library from "../pages/Library";
import useSpotifyPlayer from "../hooks/useSpotifyPlayer";
import PlayerBar from "../components/PlayerBar";

// ================== API URL CONFIG ==================
const API =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "http://localhost:3001";

export default function Home() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState("search");

    const [playlists, setPlaylists] = useState([]);
    const [aiPlaylists, setAiPlaylists] = useState([]);

    const token = localStorage.getItem("spotify_access_token");
    
    //play
    const { play, track } = useSpotifyPlayer(token);
    const audioRef = useRef(null);

    // ================= AUTH CHECK (COOKIE BASED) =================
    useEffect(() => {
        fetch(`${API}/api/me`, {
            credentials: "include"
        })
            .then(res => setIsLoggedIn(res.ok))
            .catch(() => setIsLoggedIn(false));
    }, []);

    // ================= SEARCH =================
    async function handleSearch(query) {
        setLoading(true);

        try {
            const res = await fetch(
                `${API}/api/search?q=${encodeURIComponent(query)}`,
                {
                    credentials: "include"
                }
            );

            if (!res.ok) {
                setTracks([]);
                return;
            }

            const data = await res.json();
            setTracks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setTracks([]);
        } finally {
            setLoading(false);
        }
    }

    // ================= PLAY =================
    function playPreview(url) {
        if (!url) return;

        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
    }

    // ================= LOGOUT =================
    function handleLogout() {
        // optional backend logout endpoint
        fetch(`${API}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

        setIsLoggedIn(false);
        setTracks([]);
        setPlaylists([]);
        setAiPlaylists([]);
    }

    // ================= DATA LOADERS =================
    async function loadPlaylists() {
        const res = await fetch(`${API}/api/playlists`, {
            credentials: "include"
        });

        if (!res.ok) return setPlaylists([]);

        const data = await res.json();
        setPlaylists(Array.isArray(data) ? data : []);
    }

    async function loadAiPlaylists() {
        const res = await fetch(`${API}/api/ai-playlists`, {
            credentials: "include"
        });

        if (!res.ok) return setAiPlaylists([]);

        const data = await res.json();
        setAiPlaylists(Array.isArray(data) ? data : []);
    }

    useEffect(() => {
        if (!isLoggedIn) return;

        if (activeTab === "playlists") loadPlaylists();
        if (activeTab === "ai") loadAiPlaylists();
    }, [activeTab, isLoggedIn]);

    // ================= LOGIN SCREEN =================
    if (!isLoggedIn) {
        return (
            <div style={styles.loginPage}>
                <div style={styles.loginCard}>
                    <h1 style={styles.logo}>Spotify Clone</h1>
                    <p style={styles.subtitle}>Connect to your music</p>

                    <a href={`${API}/auth/login`} style={styles.loginLink}>
                        <button style={styles.loginButton}>
                            Login with Spotify
                        </button>
                    </a>
                </div>
            </div>
        );
    }

    const TabButton = ({ label, tab }) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                ...styles.tab,
                backgroundColor: activeTab === tab ? "#1DB954" : "transparent",
                color: activeTab === tab ? "#000" : "#b3b3b3"
            }}
        >
            {label}
        </button>
    );

    return (
        <div style={styles.app}>

            <div style={styles.header}>
                <div style={styles.brand}>🎵 Spotify Clone</div>

                <button onClick={handleLogout} style={styles.logout}>
                    Log out
                </button>
            </div>

            <div style={styles.tabs}>
                <TabButton label="Search" tab="search" />
                <TabButton label="Playlists" tab="playlists" />
                <TabButton label="Library" tab="library" />
                <TabButton label="AI Mix" tab="ai" />
            </div>

            <div style={styles.content}>

                {activeTab === "search" && (
                    <>
                        <Search onSearch={handleSearch} />
                        {loading && <div style={styles.loading}>Loading...</div>}

                        <div style={styles.grid}>
                            {tracks.map(track => (
                                <div key={track.id} style={styles.card}>
                                    <img
                                        src={track.album?.images?.[0]?.url}
                                        style={styles.img}
                                    />

                                    <div style={styles.info}>
                                        <div style={styles.title}>{track.name}</div>
                                        <div style={styles.artist}>
                                            {track.artists?.[0]?.name}
                                        </div>
                                    </div>

                                    <button
                                        style={styles.play}
                                        //Testing to see if buttons work
                                        onClick={() => {
                                        console.log("CLICKED:", track.name);
                                        play(track.uri);
}}
                                    >
                                        ▶
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === "playlists" && (
                    <div>
                        <h2 style={styles.section}>Your Playlists</h2>

                        <div style={styles.playlistGrid}>
                            {playlists.map(p => (
                                <div key={p.id} style={styles.playlistCard}>
                                    <img src={p.image} style={styles.playlistImg} />
                                    <div style={styles.playlistName}>{p.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === "library" && (
                    // 🎧 FIX: pass correct player function
                    <Library playTrack={play} />
                )}

                {activeTab === "ai" && (
                    <div style={styles.section}>
                        <h2>AI Playlists</h2>
                        {aiPlaylists.map(p => (
                            <div key={p.id} style={styles.aiCard}>
                                {p.name}
                            </div>
                        ))}
                    </div>
                )}

            </div>
            {track && <PlayerBar track={track || null} />}
        </div>
    );
}

const styles = {
    app: {
        minHeight: "100vh",
        background: "linear-gradient(#121212, #000)",
        color: "#fff",
        fontFamily: "Arial",
        padding: "20px"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #222",
        paddingBottom: "10px"
    },
    brand: { color: "#1DB954", fontWeight: "bold" },
    logout: {
        background: "transparent",
        border: "1px solid #1DB954",
        color: "#1DB954",
        padding: "6px 12px",
        borderRadius: "20px",
        cursor: "pointer"
    },
    tabs: { display: "flex", gap: "10px", margin: "15px 0" },
    tab: {
        padding: "8px 14px",
        borderRadius: "20px",
        border: "1px solid #1DB954",
        cursor: "pointer"
    },
    grid: { display: "flex", flexDirection: "column", gap: "10px" },
    card: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#181818",
        padding: "10px",
        borderRadius: "10px"
    },
    img: { width: "45px", height: "45px", borderRadius: "6px" },
    info: { flex: 1 },
    title: { fontWeight: "bold" },
    artist: { fontSize: "12px", color: "#aaa" },
    play: {
        background: "#1DB954",
        border: "none",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        cursor: "pointer"
    },
    playlistGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "12px"
    },
    playlistCard: {
        background: "#181818",
        padding: "10px",
        borderRadius: "10px"
    },
    playlistImg: {
        width: "100%",
        height: "120px",
        objectFit: "cover",
        borderRadius: "8px"
    },
    playlistName: { marginTop: "8px" },
    aiCard: {
        background: "#181818",
        padding: "10px",
        borderRadius: "10px",
        marginTop: "10px"
    },
    section: { color: "#1DB954" },
    loading: { color: "#aaa" },
    loginPage: {
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(#000, #121212)"
    },
    loginCard: { textAlign: "center" },
    logo: { fontSize: "32px", color: "#1DB954" },
    subtitle: { color: "#aaa", marginBottom: "20px" },
    loginButton: {
        background: "#1DB954",
        border: "none",
        padding: "12px 20px",
        borderRadius: "25px",
        fontWeight: "bold",
        cursor: "pointer"
    },
    loginLink: { textDecoration: "none" }
};