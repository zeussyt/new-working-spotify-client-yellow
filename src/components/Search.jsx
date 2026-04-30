/*import { useState } from "react";

export default function Search({ onSearch }) {
    const [text, setText] = useState("");
    function handleSubmit(e) {
        e.preventDefault();
        if (!text.trim()) return;
        onSearch(text);
        console.log("SESSION:", req.session);
        console.log("TOKEN:", req.session.accessToken);
    }

    return (
        <form onSubmit={handleSubmit} className="search">
            <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search for a song..."
        />
        <button type="submit">Search</button>
        </form>
    );
} */
import { useState } from "react";

export default function Search({ onSearch }) {
    const [query, setQuery] = useState("");

    function handleSubmit(e) {
        e.preventDefault();

        if (!query.trim()) return;

        onSearch(query);
    }

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs..."
                style={{
                    padding: 10,
                    width: "60%",
                    borderRadius: 8,
                    border: "none"
                }}
            />

            <button
                type="submit"
                style={{
                    marginLeft: 10,
                    padding: 10,
                    background: "#1DB954",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer"
                }}
            >
                Search
            </button>
        </form>
    );
}

