import { useEffect, useState } from "react";

export default function useSpotifyPlayer(token) {
    const [player, setPlayer] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const [track, setTrack] = useState(null);

    useEffect(() => {
        if (!token) return;

        // ===================== FIX #3: WAIT FOR SDK PROPERLY =====================
        const waitForSDK = setInterval(() => {
            if (!window.Spotify || !window.Spotify.Player) return;

            clearInterval(waitForSDK);

            const p = new window.Spotify.Player({
                name: "My Spotify Clone",
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            p.addListener("ready", async ({ device_id }) => {
    console.log("DEVICE READY:", device_id);
    setDeviceId(device_id);

    // ===================== FIX #4: ACTIVATE DEVICE =====================
    const token = localStorage.getItem("spotify_access_token");

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

            p.addListener("player_state_changed", state => {
                if (!state) return;
                setTrack(state.track_window.current_track);
            });

            p.addListener("initialization_error", ({ message }) => {
                console.error("INIT ERROR:", message);
            });

            p.addListener("authentication_error", ({ message }) => {
                console.error("AUTH ERROR:", message);
            });

            p.addListener("account_error", ({ message }) => {
                console.error("ACCOUNT ERROR:", message);
            });

            p.connect().then(success => {
                console.log("PLAYER CONNECTED:", success);
            });

            setPlayer(p);
        }, 500);

        return () => clearInterval(waitForSDK);
    }, [token]);

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