import { useState, useRef } from "react";
import Search from "../components/Search";
import Library from "../pages/Library";

const API = import.meta.env.VITE_API_URL;

export default function Home() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("search");

    const audioRef = useRef(null);

    // ================= SEARCH (SAFE TEST MODE) =================
    async function handleSearch(query) {
        setLoading(true);

        try {
            const res = await fetch(
                `${API}/api/search?q=${encodeURIComponent(query)}`
            );

            const data = await res.json();
            setTracks(data || []);
        } catch (err) {
            console.error(err);
            setTracks([]);
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

    return (
        <div style={styles.app}>

            <div style={styles.header}>
                <h2 style={styles.logoSmall}>Spotify Clone</h2>
            </div>

            <div style={styles.tabBar}>
                <TabButton label="Search" tab="search" />
                <TabButton label="Library" tab="library" />
            </div>

            <div style={styles.content}>

                {activeTab === "search" && (
                    <>
                        <Search onSearch={handleSearch} />

                        {loading && <p style={styles.text}>Loading...</p>}

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

                {activeTab === "library" && <Library />}

            </div>
        </div>
    );
}

// ================= STYLES (UNCHANGED FORMAT) =================
const styles = {
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
    },

    text: {
        opacity: 0.7
    }
};