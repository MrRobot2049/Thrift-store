/**
 * Shared API fetch helper used by all merchandise/event forms.
 * - Always parses the response safely (handles HTML error pages gracefully)
 * - Throws a clean Error with the server's message if response is not OK
 */
export async function apiFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (networkErr) {
    throw new Error(
      "Could not reach the server. Make sure the backend is running on port 5000."
    );
  }

  // Safely parse body — server might return HTML on unexpected crashes
  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    // Extract a short snippet to help with debugging
    const snippet = text.replace(/<[^>]+>/g, "").trim().slice(0, 120);
    throw new Error(
      res.ok
        ? snippet || "Unexpected response from server"
        : `Server error (${res.status}): ${snippet || "Non-JSON response"}`
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || `Server error ${res.status}`);
  }

  return data;
}
