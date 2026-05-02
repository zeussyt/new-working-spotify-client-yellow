export default function PlayerBar({ track }) {
    if (!track) return null;

    return (
        <div>
            <img src={track.album.images[0].url} />
            <p>{track.name}</p>
            <p>{track.artists[0].name}</p>
        </div>
    );
}