import { useState, useRef } from "react";
import Search from "../components/Search";
import Library from "../pages/Library";

const API = import.meta.env.VITE_API_URL;

export default function Home() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState("search");

    const audioRef = useRef(null);

    // ================= AUTH CHECK =================
    async function checkLogin() {
        try {
            const res = await fetch(`${API}/api/me`, {
                credentials: "include"
            });

            setIsLoggedIn(res.ok);
        } catch {
            setIsLoggedIn(false);
        }
    }

    // optional: check on load
    useState(() => {
        checkLogin();
    }, []);

    // ================= LOGIN REDIRECT =================
    function handleLogin() {
        window.location.href = `${API}/auth/login`;
    }

    // ================= SEARCH =================
    async function handleSearch(query) {
        setLoading(true);

        try {
            const res = await fetch(
                `${API}/api/search?q=${encodeURIComponent(query)}`,
                { credentials: "include" }
            );

            const data = await res.json();
            setTracks(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function playPreview(url) {
        if (!url) return;

        if (audioRef.current) audioRef.current.pause();

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
    }

    const TabButton = ({ label, tab }) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                ...styles.tab,
                backgroundColor: activeTab === tab ? "#1DB954" : "transparent",
                color: activeTab === tab ? "#000" : "#fff"
            }}
        >
            {label}
        </button>
    );

    // ================= LOGIN SCREEN =================
    if (!isLoggedIn) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>Spotify Clone</h1>
                <p style={styles.text}>Connect your Spotify account</p>

                <button style={styles.button} onClick={handleLogin}>
                    Login with Spotify
                </button>
            </div>
        );
    }

    // ================= APP =================
    return (
        <div style={styles.app}>

            <div style={styles.header}>
                <h2 style={styles.logo}>Spotify Clone</h2>
            </div>

            <div style={styles.tabs}>
                <TabButton label="Search" tab="search" />
                <TabButton label="Library" tab="library" />
            </div>

            <div style={styles.content}>

                {activeTab === "search" && (
                    <>
                        <Search onSearch={handleSearch} />
                        {loading && <p>Loading...</p>}

                        {tracks.map(track => (
                            <div key={track.id} style={styles.card}>
                                <img
                                    src={track.album?.images?.[0]?.url}
                                    style={styles.img}
                                />

                                <div style={{ flex: 1 }}>
                                    <b>{track.name}</b>
                                    <div>{track.artists?.[0]?.name}</div>
                                </div>

                                <button
                                    onClick={() => playPreview(track.preview_url)}
                                    disabled={!track.preview_url}
                                >
                                    ▶
                                </button>
                            </div>
                        ))}
                    </>
                )}

                {activeTab === "library" && <Library />}

            </div>
        </div>
    );
}

// ================= STYLES =================
const styles = {
    container: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#121212",
        color: "white",
        fontFamily: "Arial"
    },

    title: {
        color: "#1DB954",
        fontSize: "28px"
    },

    text: {
        opacity: 0.7,
        marginBottom: "20px"
    },

    button: {
        background: "#1DB954",
        border: "none",
        padding: "10px 20px",
        borderRadius: "20px",
        cursor: "pointer",
        fontWeight: "bold"
    },

    app: {
        minHeight: "100vh",
        background: "#121212",
        color: "white",
        padding: "20px",
        fontFamily: "Arial"
    },

    header: {
        marginBottom: "10px"
    },

    logo: {
        color: "#1DB954"
    },

    tabs: {
        display: "flex",
        gap: "10px",
        marginBottom: "20px"
    },

    tab: {
        padding: "10px",
        borderRadius: "20px",
        border: "1px solid #1DB954",
        cursor: "pointer"
    },

    content: {
        padding: "10px"
    },

    card: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
        background: "#181818",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "8px"
    },

    img: {
        width: "40px",
        height: "40px",
        borderRadius: "5px"
    }
};