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

    // =========================================================
    // 🎧 SPOTIFY WEB PLAYER HOOK (FIXED USAGE)
    // =========================================================
    const { play, track } = useSpotifyPlayer(token);

    const audioRef = useRef(null);

    // ================= AUTH CHECK =================
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

    // ================= LOCAL PREVIEW PLAYER =================
    function playPreview(url) {
        if (!url) return;

        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
    }

    // ================= LOGOUT =================
    function handleLogout() {
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

                                        // =====================================================
                                        // 🎧 FIXED: Now uses Spotify Web Playback SDK properly
                                        // =====================================================
                                        onClick={() => {
                                            console.log("CLICKED:", track.name);

                                            // FIX: THIS is the real play function (NOT playTrack)
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

            {/* 🎧 FIX: safe PlayerBar rendering */}
            {track && <PlayerBar track={track} />}
        </div>
    );
}