export default function PlayerBar({ track }) {
    return (
        <div style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "80px",
            background: "#181818",
            color: "white",
            display: "flex",
            alignItems: "center",
            padding: "10px"
        }}>
            {track?.name || "Nothing playing"}
        </div>
    );
}