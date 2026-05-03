export default function PlayerBar({ track, isPlaying, onPlay, onPause, next, previous }) {
    if (!track) return null;

    return (
        <div style={styles.bar}>
            <div style={styles.info}>
                <div>{track.name}</div>
                <div style={{ fontSize: "12px", color: "#aaa" }}>
                    {track.artists?.[0]?.name}
                </div>
            </div>

            {/* Control Group */}
            <div style={styles.controls}>
                
                {/* Previous Song Button */}
                <button
                    style={styles.sideButton}
                    onClick={() => {
                        console.log("PREVIOUS CLICKED");
                        previous();
                    }}
                >
                    ⏮
                </button>

                {/* Pause /Play Button */}
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

                {/* skip button */}
                <button
                    style={styles.sideButton}
                    onClick={() => {
                        console.log("NEXT CLICKED");
                        next();
                    }}
                >
                    ⏭
                </button>

            </div>
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

    /* control group wrapper */
    controls: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },

    /* Play button*/
    button: {
        background: "#1DB954",
        border: "none",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
        cursor: "pointer",
        fontSize: "18px"
    },

    /* Skip buttones */
    sideButton: {
        background: "#282828",
        border: "none",
        borderRadius: "50%",
        width: "34px",
        height: "34px",
        cursor: "pointer",
        fontSize: "16px",
        color: "#fff"
    }
};