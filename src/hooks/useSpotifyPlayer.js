import { useEffect, useState } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    useEffect(() => {
        if (!token) return;

        // ===================== FIX #1: ENSURE GLOBAL CALLBACK EXISTS =====================
        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Spotify SDK Ready");

            const p = new window.Spotify.Player({
                name: "My Spotify Clone",
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            // ===================== READY =====================
            p.addListener("ready", async ({ device_id }) => {
                console.log("DEVICE READY:", device_id);
                setDeviceId(device_id);

                // ===================== FIX #2: ACTIVATE DEVICE PROPERLY =====================
                try {
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
                } catch (err) {
                    console.error("Device activation failed:", err);
                }
            });

            // ===================== STATE CHANGE =====================
            p.addListener("player_state_changed", (state) => {
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

            setPlayer(p);
        };

        // ===================== FIX #3: LOAD SCRIPT ONLY ONCE =====================
        if (!window.Spotify) {
            const script = document.createElement("script");
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            document.body.appendChild(script);
        }
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

        try {
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
        } catch (err) {
            console.error("Play failed:", err);
        }
    }

    return { play, track, deviceId };
}