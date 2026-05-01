import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";
import fs from "fs";
import jwt from "jsonwebtoken";
const scope =
  "user-read-email user-read-private user-library-read playlist-read-private playlist-read-collaborative user-top-read user-read-playback-state user-modify-playback-state streaming";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
//let codeVerifierGlobal = null; //need to store this in session storage
const app = express();

/*const scope = [
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
*/

app.get("/auth/login", async (req, res) => {
  const codeVerifier = await generateCodeVerifier();

  req.session.codeVerifier = codeVerifier; 

  const uri = await client.authorizationCode.getAuthorizeUri({
    redirectUri: process.env.SC_REDIRECT_URI,
    codeVerifier,
    scope : scope,
  });

  res.redirect(uri);
});

//const raw = fs.readFileSync(".env");
//console.log("Raw bytes:", raw);
//console.log("As string:", raw.toString());
//console.log("CWD:", process.cwd());

dotenv.config({ path: "./.env" });
console.log("CLIENT ID:", process.env.SC_CLIENT_ID);



let accessToken = null;
app.use(cors({
  origin: "https://new-working-spotify-client-yellow.vercel.app",
  credentials: true
}));
app.use(express.json());
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});

// ================= LOGIN =================
const client = new OAuth2Client({
  // maybe change back to server: "https://api.spotify.com"
  server: "https://accounts.spotify.com" ,
  authorizationEndpoint: process.env.SC_AUTHORIZATION_URL,
  tokenEndpoint: process.env.SC_TOKEN_URL,
  clientId: process.env.SC_CLIENT_ID,
  clientSecret: process.env.SC_CLIENT_SECRET,
  redirectUri: process.env.SC_REDIRECT_URI,
  pkce: true, // turns on PKCE automatically
});

const redirectUri = process.env.SC_REDIRECT_URI;


app.set("trust proxy", 1);
/*app.use(session({
  store: new FileStoreSession({
    path: "./sessions",
    ttl: 86400,
  }),
  secret: "meoasudhfa41242",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // MUST be true in production HTTPS
    sameSite: "none",    // CRITICAL for cross-site login
    maxAge: 86400000
  }
}));
*/
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

/*app.get("/auth/login", async (req, res) => {
  const codeVerifier = await generateCodeVerifier();

  const uri = await client.authorizationCode.getAuthorizeUri({
  redirectUri: process.env.SC_REDIRECT_URI,
  codeVerifier,
  scope: [
    "user-read-email",
    "user-read-private",
    "user-library-read",
    "playlist-read-private"
  ].join(" ")
});

  codeVerifierGlobal = codeVerifier;

  res.redirect("https://new-working-spotify-client-yellow.vercel.app");
});
BRING BACK IF SOMETHING BREAKS */

app.get("/auth/login", async (req, res) => {
  try {
    const codeVerifier = await generateCodeVerifier();

    req.session.codeVerifier = codeVerifier;

    const uri = await client.authorizationCode.getAuthorizeUri({
      redirectUri: process.env.SC_REDIRECT_URI,
      codeVerifier,
      scope, 
    });

    res.redirect(uri);

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      error: "Auth login failed",
      details: err.message
    });
  }
});

app.get("/debug/token", (req, res) => {
    res.json({
        hasToken: !!req.accessToken,
        tokenPreview: req.accessToken?.slice(0, 20)
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

    const accessToken = tokenSet.accessToken;

    // ✅ create JWT instead of session
    const jwtToken = jwt.sign(
      { accessToken },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // send user back to frontend with token
    res.redirect(`https://new-working-spotify-client-yellow.vercel.app?token=${jwtToken}`);

  } catch (error) {
    console.error("Auth error", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// ================= LOGIN CHECK ===============
app.get("/api/me", (req, res) => {
  console.log("api.me is functioning")
  if (!req.accessToken) {
    return res.status(401).json({ loggedIn: false });
  }

  res.json({ loggedIn: true });
});

// ================= SEARCH =================

app.get("/api/search", async (req, res) => {
  const query = req.query.q;

  console.log("Search request:", query);
  const token = req.accessToken;
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
  const token = req.accessToken;

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
    const token = req.accessToken;

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
