import { useEffect, useState } from "react";
import api from "../api/api"; 

export default function Library({ playTrack }) {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        // ✅ PREVENT REQUEST WITHOUT TOKEN (fixes your 401 spam)
        if (!token) {
            setLoading(false);
            return;
        }

        loadLibrary();
    }, []);

    async function loadLibrary() {
        setLoading(true);

        try {
            const data = await api.get("/api/library");

            console.log("LIBRARY DATA:", data);

            setTracks(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error("Library error:", err);
            setTracks([]);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={styles.loading}>
                Loading library...
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>
                Recently Added
            </h2>

            {tracks.length === 0 && (
                <div style={styles.empty}>No tracks found.</div>
            )}

            {tracks.map(track => (
                <div key={track.id} style={styles.card}>
                    <img
                        src={track.albumImage}
                        style={styles.image}
                    />

                    <div style={styles.info}>
                        <div style={styles.name}>
                            {track.name}
                        </div>
                        <div style={styles.artist}>
                            {track.artists}
                        </div>
                    </div>

                    <button
                        style={styles.play}
                        onClick={() => playTrack?.(track.uri)}
                    >
                        ▶
                    </button>
                </div>
            ))}
        </div>
    );
}

/* ================= STYLES ================= */

const styles = {
    container: {
        color: "white",
        padding: "10px"
    },

    title: {
        color: "#1DB954",
        marginBottom: "10px"
    },

    loading: {
        color: "#aaa",
        padding: "20px"
    },

    empty: {
        color: "#777",
        padding: "10px"
    },

    card: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px",
        background: "#181818",
        marginBottom: "8px",
        borderRadius: "10px",
        transition: "0.2s"
    },

    image: {
        width: "45px",
        height: "45px",
        borderRadius: "6px",
        objectFit: "cover"
    },

    info: {
        flex: 1
    },

    name: {
        fontWeight: "bold"
    },

    artist: {
        fontSize: "12px",
        color: "#aaa"
    },

    play: {
        background: "#1DB954",
        border: "none",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        cursor: "pointer"
    }
};