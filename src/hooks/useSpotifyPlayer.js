import { useEffect, useState, useRef } from "react";

export default function useSpotifyPlayer(token) {
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    const playerRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!token) return;

        // Prevent double init in React StrictMode
        if (initializedRef.current) return;
        initializedRef.current = true;

        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("🎧 Spotify SDK Ready");

            const player = new window.Spotify.Player({
                name: "Spotify Clone",
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            player.addListener("ready", ({ device_id }) => {
                console.log("✅ DEVICE READY:", device_id);
                setDeviceId(device_id);
            });

            player.addListener("player_state_changed", state => {
                if (!state) return;

                setTrack(state.track_window.current_track);
            });

            player.addListener("initialization_error", e =>
                console.error("INIT ERROR:", e)
            );

            player.addListener("authentication_error", e =>
                console.error("AUTH ERROR:", e)
            );

            player.addListener("account_error", e =>
                console.error("ACCOUNT ERROR:", e)
            );

            player.connect();

            playerRef.current = player;
        };
    }, [token]);

    async function play(uri) {
        if (!deviceId || !token) {
            console.log("⏳ Player not ready:", { deviceId, token });
            return;
        }

        console.log("▶️ Playing:", uri);

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