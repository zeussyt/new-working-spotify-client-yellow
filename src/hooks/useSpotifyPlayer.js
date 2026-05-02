import { useEffect, useState } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    useEffect(() => {
        if (!token) return;

        window.onSpotifyWebPlaybackSDKReady = () => {
            const p = new window.Spotify.Player({
                name: "My Spotify Clone",
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            p.addListener("ready", ({ device_id }) => {
                setDeviceId(device_id);
                console.log("DEVICE READY:", device_id);
            });

            p.addListener("player_state_changed", state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            p.connect();
            setPlayer(p);
        };
    }, [token]);

    async function play(uri) {
        if (!deviceId || !token) {
            console.log("Player not ready yet");
            return;
        }

        await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
                method: "PUT",
                body: JSON.stringify({
                    uris: [uri]
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }

    return { play, track };
}