import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_URL;

export default function Library({ playTrack }) {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredId, setHoveredId] = useState(null);

    useEffect(() => {
        loadLibrary();
    }, []);

    async function loadLibrary() {
        setLoading(true);

        try {
            const res = await fetch(`${API}/api/library`, { credentials: "include" })

            const data = await res.json();

            console.log("LIBRARY (10 songs):", data);

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
            <div style={{ color: "white", padding: 20 }}>
                Loading library...
            </div>
        );
    }

    return (
        <div style={{ color: "white", padding: 10 }}>
            <h2 style={{ color: "#1DB954" }}>
                Recently Added (Top 10)
            </h2>


{tracks.map(track => {
    const isHovered = hoveredId === track.id;

    return (
        <div
            key={track.id}
            onMouseEnter={() => setHoveredId(track.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                background: "#181818",
                marginBottom: 8,
                borderRadius: 8,

                // 🔥 hover effect
                transform: isHovered ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s ease",
                position: "relative",
                zIndex: isHovered ? 10 : 1
            }}
        >
            <img
                src={track.albumImage}
                width={40}
                height={40}
                style={{
                    borderRadius: 4,

                    // 🔥 album art pops forward
                    transform: isHovered ? "scale(1.3)" : "scale(1)",
                    transition: "all 0.2s ease",
                    position: "relative",
                    zIndex: isHovered ? 20 : 1
                }}
            />

            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>
                    {track.name}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {track.artists}
                </div>
            </div>

            <button
                style={{
                    background: "#1DB954",
                    border: "none",
                    borderRadius: 20,
                    padding: "6px 10px",
                    cursor: "pointer",

                    // 🔥 fades in on hover
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? "scale(1)" : "scale(0.8)",
                    transition: "all 0.2s ease"
                }}
                onClick={() => playTrack?.(track.uri)}
            >
                ▶
            </button>
        </div>
    );
})}
        </div>
    );
}