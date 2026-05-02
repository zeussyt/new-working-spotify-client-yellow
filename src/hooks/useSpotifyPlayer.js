import { useEffect, useState, useRef } from "react";

export default function useSpotifyPlayer(token) {
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    const playerRef = useRef(null);
    const tokenRef = useRef(token);
    tokenRef.current = token;

    useEffect(() => {
        if (!token) return;

        const initPlayer = () => {
            const player = new window.Spotify.Player({
                name: "Spotify Clone",
                getOAuthToken: cb => cb(tokenRef.current),
                volume: 0.5
            });

            player.addListener("ready", ({ device_id }) => {
                console.log("DEVICE READY:", device_id);
                setDeviceId(device_id);
            });

            player.addListener("player_state_changed", state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            player.addListener("authentication_error", e =>
                console.error("AUTH ERROR:", e)
            );

            player.connect();
            playerRef.current = player;
        };

        const handler = () => {
            console.log("SDK EVENT RECEIVED");
            initPlayer();
        };

        window.addEventListener("spotify-sdk-ready", handler);

        // fallback (if already loaded)
        if (window.Spotify) handler();

        return () => {
            window.removeEventListener("spotify-sdk-ready", handler);
        };
    }, [token]);

    async function play(uri) {
        if (!deviceId) {
            console.log("❌ No device yet");
            return;
        }

        console.log("▶️ PLAY:", uri);

        await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    uris: [uri]
                })
            }
        );
    }

    return { play, track };
}