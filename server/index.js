import { useEffect, useState, useRef } from "react";
import Search from "../components/Search";
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

    // ================= AUTH CHECK (FIXED) =================
    useEffect(() => {
        async function checkLogin() {
            try {
                const res = await fetch(`${API}/api/me`, {
                    credentials: "include"
                });

                setIsLoggedIn(res.ok);
            } catch (err) {
                console.error(err);
                setIsLoggedIn(false);
            }
        }

        checkLogin();
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

            const data = await res.json();
            setTracks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
    }

    // ================= LOGOUT =================
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

    // ================= DATA LOADERS =================
    async function loadPlaylists() {
        const res = await fetch(`${API}/api/playlists`, {
            credentials: "include"
        });
        setPlaylists(await res.json());
    }

    async function loadLibrary() {
        const res = await fetch(`${API}/api/library`, {
            credentials: "include"
        });
        setLibrary(await res.json());
    }

    async function loadAiPlaylists() {
        const res = await fetch(`${API}/api/ai-playlists`, {
            credentials: "include"
        });
        setAiPlaylists(await res.json());
    }

    useEffect(() => {
        if (!isLoggedIn) return;

        if (activeTab === "playlists") loadPlaylists();
        if (activeTab === "library") loadLibrary();
        if (activeTab === "ai") loadAiPlaylists();
    }, [activeTab, isLoggedIn]);

    // ================= LOGIN SCREEN =================
    if (!isLoggedIn) {
        return (
            <div style={styles.loginContainer}>
                <h1 style={styles.logo}>Spotify Clone</h1>
                <p style={styles.subtitle}>Connect to your music</p>

                <a href={`${API}/auth/login`}>
                    <button style={styles.loginButton}>
                        Login with Spotify
                    </button>
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
                transform: activeTab === tab ? "scale(1.05)" : "scale(1)"
            }}
        >
            {label}
        </button>
    );

    // ================= APP =================
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
                        {loading && <p>Loading...</p>}

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
                                        <div style={{ opacity: 0.7 }}>
                                            {track.artists?.[0]?.name}
                                        </div>
                                    </div>

                                    <button
                                        style={styles.playButton}
                                        onClick={() => playPreview(track.preview_url)}
                                        disabled={!track.preview_url}
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
                        <h3 style={styles.sectionTitle}>Your Playlists</h3>

                        <div style={styles.playlistGrid}>
                            {playlists.map(p => (
                                <div key={p.id} style={styles.playlistCard}>
                                    <img src={p.image} style={styles.playlistImg} />
                                    <div>{p.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "library" && <Library />}

                {activeTab === "ai" && (
                    <div>
                        <h3 style={styles.sectionTitle}>AI Playlists</h3>
                        {aiPlaylists.map(p => (
                            <div key={p.id}>{p.name}</div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}