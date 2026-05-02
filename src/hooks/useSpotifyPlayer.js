import { useEffect, useState } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    useEffect(() => {
        if (!token) return;

        // ===================== FIX #1: GLOBAL CALLBACK (REQUIRED) =====================
        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Spotify SDK Ready");

            const p = new window.Spotify.Player({
                name: "My Spotify Clone",
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            // ===================== READY EVENT =====================
            p.addListener("ready", async ({ device_id }) => {
                console.log("DEVICE READY:", device_id);
                setDeviceId(device_id);

                // ===================== FIX #2: ACTIVATE DEVICE =====================
                await fetch("https://api.spotify.com/v1/me/player", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        device_ids: [device_id],
                        play: false
                    })
                });

                console.log("DEVICE ACTIVATED");
            });

            // ===================== STATE CHANGE =====================
            p.addListener("player_state_changed", state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            // ===================== ERRORS =====================
            p.addListener("initialization_error", ({ message }) =>
                console.error("INIT ERROR:", message)
            );

            p.addListener("authentication_error", ({ message }) =>
                console.error("AUTH ERROR:", message)
            );

            p.addListener("account_error", ({ message }) =>
                console.error("ACCOUNT ERROR:", message)
            );

            // ===================== CONNECT =====================
            p.connect().then(success => {
                console.log("PLAYER CONNECTED:", success);
            });

            p.addListener("player_state_changed", state => {
            if (!state) return;

                setTrack(state.track_window.current_track);
                setIsPlaying(!state.paused);
                    });

            setPlayer(p);
        };
    }, [token]);

    // ===================== PLAY FUNCTION =====================
    async function play(uri) {
        if (!deviceId) {
            console.log("Player not ready:", {
                deviceId,
                tokenExists: !!token
            });
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
// ===================== PAUSE FUNCTION =====================
    async function pause() {
    if (!deviceId) {
        console.log("No active device");
        return;
    }

    await fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}
// ===================== RESUME FUNCTION =====================
async function resume() {
    if (!deviceId) {
        console.log("No active device");
        return;
    }

    await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

    return { play, pause, resume, track, deviceId };
}