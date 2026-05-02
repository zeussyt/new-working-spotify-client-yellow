const API = import.meta.env.VITE_API_URL;

// ================= GET TOKEN =================
function getToken() {
  return localStorage.getItem("token");
}

// ================= CORE FETCH =================
async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  // ================= AUTO 401 HANDLING =================
  if (res.status === 401) {
    console.warn("Unauthorized - clearing token");

    localStorage.removeItem("token");

    // optional redirect (safe for SPA)
    window.location.href = "/";

    return null;
  }

  return res;
}

// ================= HELPERS =================
async function get(path) {
  const res = await apiFetch(path);
  if (!res) return null;
  return res.json();
}

async function post(path, body) {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
  if (!res) return null;
  return res.json();
}

async function del(path) {
  const res = await apiFetch(path, {
    method: "DELETE"
  });
  if (!res) return null;
  return res.json();
}

// ================= EXPORT =================
export default {
  get,
  post,
  del
};