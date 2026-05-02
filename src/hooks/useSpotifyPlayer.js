import { useEffect, useState } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    useEffect(() => {
        if (!token) return;

        const scriptId = "spotify-sdk";

        // avoid double-loading
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            document.body.appendChild(script);
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
            const p = new window.Spotify.Player({
                name: "Spotify Clone",
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            p.addListener("ready", ({ device_id }) => {
                console.log("DEVICE READY:", device_id);
                setDeviceId(device_id);
            });

            p.addListener("player_state_changed", state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            p.addListener("initialization_error", ({ message }) =>
                console.error("INIT ERROR:", message)
            );

            p.connect();
            setPlayer(p);
        };
    }, [token]);

    async function play(uri) {
        if (!deviceId || !token) {
            console.log("Player not ready");
            return;
        }

        await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uris: [uri]
                })
            }
        );
    }

    return { play, track };
}