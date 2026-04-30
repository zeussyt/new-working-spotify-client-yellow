import { useEffect, useState } from "react";

export default function Library({ playTrack }) {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

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

            {tracks.map(track => (
                <div
                    key={track.id}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        background: "#181818",
                        marginBottom: 8,
                        borderRadius: 8
                    }}
                >
                    <img
                        src={track.albumImage}
                        width={40}
                        height={40}
                        style={{ borderRadius: 4 }}
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
                            cursor: "pointer"
                        }}
                        onClick={() => playTrack?.(track.uri)}
                    >
                        ▶
                    </button>
                </div>
            ))}
        </div>
    );
}