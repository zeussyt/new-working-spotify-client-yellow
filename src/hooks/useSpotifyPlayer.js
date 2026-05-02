import { useEffect, useState, useRef } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false); 

    const playerRef = useRef(null);

    useEffect(() => {
        if (!token) return;

        // ===================== FIX #1: WAIT FOR SDK =====================
        if (!window.onSpotifyWebPlaybackSDKReady) {
            window.onSpotifyWebPlaybackSDKReady = initializePlayer;
        } else {
            initializePlayer();
        }

        function initializePlayer() {
            console.log("Spotify SDK Ready");

            const p = new window.Spotify.Player({
                name: "My Spotify Clone",
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            playerRef.current = p;

            // ===================== READY =====================
            p.addListener("ready", async ({ device_id }) => {
                console.log("DEVICE READY:", device_id);
                setDeviceId(device_id);

                // activate device
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

            // ===================== STATE CHANGE (GLOBAL FIX) =====================
            p.addListener("player_state_changed", (state) => {
                if (!state) return;

                setTrack(state.track_window.current_track);
                setIsPlaying(!state.paused); 
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
        }

        // cleanup
        return () => {
            if (playerRef.current) {
                playerRef.current.disconnect();
            }
        };
    }, [token]);

    // ===================== PLAY =====================
    async function play(uri) {
        if (!deviceId) {
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

    // ===================== PAUSE =====================
    async function pause() {
        if (!deviceId) return;

        await fetch("https://api.spotify.com/v1/me/player/pause", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    // ===================== RESUME =====================
    async function resume() {
        if (!deviceId) return;

        await fetch("https://api.spotify.com/v1/me/player/play", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return {
        play,
        pause,
        resume,
        track,
        deviceId,
        isPlaying 
    };
}