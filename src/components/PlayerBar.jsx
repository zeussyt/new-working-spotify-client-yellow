export default function PlayerBar({ track, isPlaying, onPlay, onPause }) {
    if (!track) return null;

    return (
        <div>
            <div>{track.name}</div>

            {isPlaying ? (
                <button onClick={onPause}>⏸ Pause</button>
            ) : (
                <button onClick={onPlay}>▶ Play</button>
            )}
        </div>
    );
}