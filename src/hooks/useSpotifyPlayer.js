import { useEffect, useState } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!token) return;

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: "Spotify Clone Player",
                getOAuthToken: cb => cb(token),
                volume: 0.8
            });

            player.addListener("ready", ({ device_id }) => {
                setDeviceId(device_id);
                setReady(true);
            });

            player.addListener("player_state_changed", (state) => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            player.connect();
            setPlayer(player);
        };

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

    }, [token]);

    async function play(uri) {
        if (!deviceId) return;

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uris: [uri]
            })
        });
    }

    return { play, track, ready };
}