const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const getToken = () => localStorage.getItem("ax_admin_token");
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("ax_admin_user") || "null"); } catch { return null; }
};
export const setSession = (token, user) => {
  localStorage.setItem("ax_admin_token", token);
  localStorage.setItem("ax_admin_user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("ax_admin_token");
  localStorage.removeItem("ax_admin_user");
};
export const can = (cap) => (getUser()?.caps || []).includes(cap);

export const fmtError = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && e.msg) || JSON.stringify(e)).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};

export async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) {
    clearSession();
    window.location.href = "/admin/login";
    throw new Error("unauthorized");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(fmtError(body.detail));
  return body;
}

export async function download(path, filename) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (res.status === 401) {
    clearSession();
    window.location.href = "/admin/login";
    return;
  }
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
