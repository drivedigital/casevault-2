export interface CourtLinkInfo {
  url: string;
  label: string;
  courtType: "nyscef" | "pacer" | "general";
}

// Preserve recorded court URLs (NYSCEF or PACER NextGen CM/ECF)
export function liveCourtLink(sourceUrl: string | null): CourtLinkInfo | null {
  if (!sourceUrl) return null;
  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (url.hostname === "iapps.courts.state.ny.us" && url.pathname.startsWith("/nyscef/")) {
      return { url: url.href, label: "Open Live NYSCEF Docket", courtType: "nyscef" };
    }
    if (url.hostname.endsWith(".uscourts.gov")) {
      return { url: url.href, label: "Open Live PACER / CM/ECF Docket", courtType: "pacer" };
    }
    return null;
  } catch {
    return null;
  }
}

export function liveNyscefUrl(sourceUrl: string | null): string | null {
  const info = liveCourtLink(sourceUrl);
  return info ? info.url : null;
}
