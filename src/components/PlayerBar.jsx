export default function PlayerBar({ track, isPlaying, onPlay, onPause }) {
    if (!track) return null;

    return (
        <div style={styles.bar}>
            <div style={styles.info}>
                <div>{track.name}</div>
                <div style={{ fontSize: "12px", color: "#aaa" }}>
                    {track.artists?.[0]?.name}
                </div>
            </div>

            <button
                style={styles.button}
                onClick={() => {
                    if (isPlaying) {
                        console.log("PAUSE CLICKED");
                        onPause();
                    } else {
                        console.log("PLAY CLICKED");
                        onPlay();
                    }
                }}
            >
                {isPlaying ? "⏸" : "▶"}
            </button>
        </div>
    );
}

const styles = {
    bar: {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "70px",
        background: "#181818",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        borderTop: "1px solid #333",
        zIndex: 1000
    },
    info: {
        color: "#fff"
    },
    button: {
        background: "#1DB954",
        border: "none",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        cursor: "pointer",
        fontSize: "18px"
    }
};