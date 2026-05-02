import { useEffect, useState } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    useEffect(() => {
        if (!token) return;

        // IMPORTANT: SDK loads globally
        if (!window.Spotify) {
            console.error("Spotify SDK not loaded");
            return;
        }

        const p = new window.Spotify.Player({
            name: "Spotify Clone Player",
            getOAuthToken: cb => cb(token),
            volume: 0.5
        });

        p.addListener("ready", ({ device_id }) => {
            console.log("DEVICE READY:", device_id);
            setDeviceId(device_id);
        });

        p.addListener("not_ready", ({ device_id }) => {
            console.log("Device offline:", device_id);
        });

        p.addListener("player_state_changed", (state) => {
            if (!state) return;

            setTrack(state.track_window?.current_track || null);
        });

        p.connect();

        setPlayer(p);

        return () => p.disconnect();
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