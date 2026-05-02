import { useEffect, useState, useRef } from "react";

export default function useSpotifyPlayer(token) {
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    const playerRef = useRef(null);
    const tokenRef = useRef(token);

    tokenRef.current = token;

    useEffect(() => {
        if (!token) return;

        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("🎧 SDK READY");

            const player = new window.Spotify.Player({
                name: "Spotify Clone",
                getOAuthToken: cb => cb(tokenRef.current),
                volume: 0.5
            });

            player.addListener("ready", ({ device_id }) => {
                console.log("✅ DEVICE:", device_id);
                setDeviceId(device_id);
            });

            player.addListener("player_state_changed", state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            player.connect();
            playerRef.current = player;
        };

        // 🚨 If SDK already loaded, force trigger manually
        if (window.Spotify) {
            window.onSpotifyWebPlaybackSDKReady();
        }

    }, [token]);

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

    return { play, track };
}