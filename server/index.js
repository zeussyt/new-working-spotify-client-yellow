import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { generateCodeVerifier, OAuth2Client } from "@badgateway/oauth2-client";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

dotenv.config({ path: "./.env" });

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

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const app = express();

// ================= MIDDLEWARE =================

app.use(cors({
  origin: "https://new-working-spotify-client-yellow.vercel.app",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);

// ================= DEBUG =================

process.on("unhandledRejection", err => {
  console.error("UNHANDLED REJECTION:", err);
});

process.on("uncaughtException", err => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// ================= OAUTH CLIENT =================

const client = new OAuth2Client({
  server: "https://accounts.spotify.com",
  authorizationEndpoint: process.env.SC_AUTHORIZATION_URL,
  tokenEndpoint: process.env.SC_TOKEN_URL,
  clientId: process.env.SC_CLIENT_ID,
  clientSecret: process.env.SC_CLIENT_SECRET,
  redirectUri: process.env.SC_REDIRECT_URI,
  pkce: true,
});

// ================= AUTH MIDDLEWARE =================

function auth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1] ||
      req.query.token;

    if (!token) return res.status(401).json({ loggedIn: false });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.accessToken = decoded.accessToken;

    next();
  } catch (err) {
    return res.status(401).json({ loggedIn: false });
  }
}

// ================= LOGIN =================

app.get("/auth/login", async (req, res) => {
  try {
    console.log("LOGIN ROUTE HIT");

    const codeVerifier = await generateCodeVerifier();

    res.cookie("code_verifier", codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    });

    const uri = await client.authorizationCode.getAuthorizeUri({
      redirectUri: process.env.SC_REDIRECT_URI,
      codeVerifier,
      scope
    });

    console.log("AUTH URL GENERATED");

    return res.redirect(uri);

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      error: "Auth login failed",
      details: err.message
    });
  }
});

// ================= CALLBACK =================

app.get("/auth/callback", async (req, res) => {
  try {
    const fullRedirectUrl =
      `${req.protocol}://${req.get("host")}${req.originalUrl}`;

    const codeVerifier = req.cookies.code_verifier;

    if (!codeVerifier) {
      throw new Error("Missing code_verifier cookie");
    }

    const tokenSet = await client.authorizationCode.getTokenFromCodeRedirect(
      fullRedirectUrl,
      {
        redirectUri: process.env.SC_REDIRECT_URI,
        codeVerifier,
      }
    );

    const jwtToken = jwt.sign(
      { accessToken: tokenSet.accessToken },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
//possible cookie fix
    return res.redirect(`${process.env.FRONTEND_URL}?token=${jwtToken}`);

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    });

    return res.redirect(process.env.FRONTEND_URL);

  } catch (error) {
    console.error("AUTH CALLBACK ERROR:", error);
    return res.status(500).json({
      error: "Authentication failed",
      details: error.message
    });
  }
});

// ================= LOGIN CHECK =================

app.get("/api/me", auth, (req, res) => {
  return res.json({ loggedIn: true });
});

// ================= SEARCH =================

app.get("/api/search", auth, async (req, res) => {
  const query = req.query.q;

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/search",
      {
        params: {
          q: query,
          type: "track",
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${req.accessToken}`
        }
      }
    );

    res.json(response.data.tracks.items);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// ================= LIBRARY =================

app.get("/api/library", auth, async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/tracks",
      {
        headers: {
          Authorization: `Bearer ${req.accessToken}`
        },
        params: { limit: 50 }
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

// ================= PLAYLISTS =================

app.get("/api/playlists", auth, async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/playlists",
      {
        headers: {
          Authorization: `Bearer ${req.accessToken}`
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

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});