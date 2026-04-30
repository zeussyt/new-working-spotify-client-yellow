import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";
import fs from "fs";
import session from "express-session";
import FileStore from 'session-file-store'
let codeVerifierGlobal = null; //need to store this in session storage

//const raw = fs.readFileSync(".env");
//console.log("Raw bytes:", raw);
//console.log("As string:", raw.toString());
//console.log("CWD:", process.cwd());

dotenv.config({ path: "./.env" });
console.log("CLIENT ID:", process.env.SC_CLIENT_ID);

const scope = [
    "user-read-email",
    "user-read-private",
    "user-library-read",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-top-read",
    "user-read-playback-state",
    "user-modify-playback-state",
    "streaming"
];
const app = express();
let accessToken = null;
app.use(cors({
  origin: "https://new-working-spotify-client-yellow.vercel.app",
  credentials: true
}));
app.use(express.json());
const FileStoreSession = FileStore(session);
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});

// ================= LOGIN =================
const client = new OAuth2Client({
  server: "https://api.spotify.com",
  authorizationEndpoint: process.env.SC_AUTHORIZATION_URL,
  tokenEndpoint: process.env.SC_TOKEN_URL,
  clientId: process.env.SC_CLIENT_ID,
  clientSecret: process.env.SC_CLIENT_SECRET,
  redirectUri: process.env.SC_REDIRECT_URI,
  pkce: true, // turns on PKCE automatically
});

const redirectUri = process.env.SC_REDIRECT_URI;

app.use(session({
  store: new FileStoreSession({
    path: "./sessions",
    ttl: 86000,
  }),
  secret: "meoasudhfa41242",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none",
    maxAge: 86400000
  }
}));

// Step 1: redirect user to Spotify login
/*app.get("/auth/login", async (req, res) => {
  const codeVerifier  = await generateCodeVerifier();
  const uri = await client.authorizationCode.getAuthorizeUri({
    redirectUri: process.env.SC_REDIRECT_URI,
    codeVerifier,
    scope: "",
  });
  codeVerifierGlobal = codeVerifier;
  //console.log("url is " + uri);
  res.redirect(uri);
});
POSSIBLE FIX? */ 

app.get("/auth/login", async (req, res) => {
  const codeVerifier = await generateCodeVerifier();

  const uri = await client.authorizationCode.getAuthorizeUri({
    redirectUri: process.env.SC_REDIRECT_URI,
    codeVerifier,
    scope: scope, 
  });

  codeVerifierGlobal = codeVerifier;

  res.redirect("https://new-working-spotify-client-yellow.vercel.app");
});

app.get("/debug/token", (req, res) => {
    res.json({
        hasToken: !!req.session.accessToken,
        tokenPreview: req.session.accessToken?.slice(0, 20)
    });
});

// Step 2: handle callback
app.get("/auth/callback", async (req, res) => {
  const fullRedirectUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;

  try {
    const tokenSet = await client.authorizationCode.getTokenFromCodeRedirect(
      fullRedirectUrl,
      {
        redirectUri: process.env.SC_REDIRECT_URI,
        codeVerifier: codeVerifierGlobal,
      }
    );

    console.log("Access Token:", tokenSet.accessToken);

    req.session.accessToken = tokenSet.accessToken;

    // 🔥 FORCE SESSION SAVE BEFORE REDIRECT
    req.session.save(err => {
      if (err) {
        console.error("Session save failed:", err);
        return res.status(500).send("Session error");
      }

      res.redirect("https://new-working-spotify-client-yellow.vercel.app");
    });

  } catch (error) {
    console.error("Access Token Error", error.message);
    res.status(500).json("Authentication failed");
  }
});

// ================= LOGIN CHECK ===============
app.get("/api/me", (req, res) => {
  console.log("api.me is functioning")
  if (!req.session.accessToken) {
    return res.status(401).json({ loggedIn: false });
  }

  res.json({ loggedIn: true });
});

// ================= SEARCH =================

app.get("/api/search", async (req, res) => {
  const query = req.query.q;

  console.log("Search request:", query);
  const token = req.session.accessToken;
  if (!token) {
    return res.status(401).json({
      error: "Not logged in"
    });
  }

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/search", //maybe try api-v2 if this doesnt work
      {
        params: {
          q: query,
          type: "track",  //maybe remove type: track if its not returning albums or artists
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data.tracks.items); //spotify wraps results in tracks.items

  } catch (err) {
    console.error(
      "Spotify error:",
      err.response?.data || err.message
    );

    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/library", async (req, res) => {
  const token = req.session.accessToken;

  if (!token) return res.status(401).json([]);

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/tracks",
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          limit: 50
        }
      }
    );

    const items = response.data.items
      .map(item => ({
        id: item.track?.id,
        name: item.track?.name,
        uri: item.track?.uri,
        artists: item.track?.artists?.map(a => a.name).join(", "),
        albumImage: item.track?.album?.images?.[0]?.url,
        addedAt: item.added_at
      }))
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, 100);

    res.json(items);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.json([]);
  }
});

app.get("/api/playlists", async (req, res) => {
    const token = req.session.accessToken;

    if (!token) return res.status(401).json([]);

    try {
        const response = await axios.get(
            "https://api.spotify.com/v1/me/playlists",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const playlists = response.data.items.map(p => ({
            id: p.id,
            name: p.name,
            image: p.images?.[0]?.url || null,
            tracks: p.tracks.total
        }));

        res.json(playlists);

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.json([]);
    }
});

// ================= START =================

app.listen(3001, "127.0.0.1", () => {
  console.log("Backend running on port 3001");
});
