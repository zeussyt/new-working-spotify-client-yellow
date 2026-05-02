export default function PlayerBar({ track }) {
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
    if (!track) return null;

    return (
        <div>
            <img src={track.album.images[0].url} />
            <p>{track.name}</p>
            <p>{track.artists[0].name}</p>
        </div>
    );
}