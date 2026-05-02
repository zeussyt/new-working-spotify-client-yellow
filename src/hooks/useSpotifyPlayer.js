import { useEffect, useState, useRef } from "react";

export default function useSpotifyPlayer(token) {
    const playerRef = useRef(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    // Load SDK
    useEffect(() => {
        if (!token) return;

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
             name: "Spotify Clone",
             getOAuthToken: cb => {
             cb(localStorage.getItem("spotify_access_token"));
  }
});

            playerRef.current = player;

            // Ready
            player.addListener("ready", ({ device_id }) => {
                console.log("READY DEVICE:", device_id);
                setDeviceId(device_id);
            });

            // Track change
            player.addListener("player_state_changed", state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            player.connect();
        };
    }, [token]);

    // Play track
    async function play(uri) {
        if (!deviceId || !token) return;

        await fetch(
            `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
            {
                method: "PUT",
                body: JSON.stringify({ uris: [uri] }),
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }

    return { play, track, deviceId };
}