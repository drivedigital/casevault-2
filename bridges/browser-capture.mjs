// Run with a tab obtained from the Codex browser runtime, inside its supported JS tool.
// Only observed docket-table DOM and pagination links are read. No session stores are read.
export async function captureBrowserDocket(tab) {
  const pages = []; const visited = new Set(); let queue = [];
  while (true) {
    const snapshot = await tab.playwright.evaluate(() => {
      const url = new URL(location.href);
      const table = [...document.querySelectorAll('table')].find(candidate => [...candidate.rows].some(row => /^\d+$/.test(row.cells[0]?.innerText.trim() ?? '')));
      const pagination = [...document.querySelectorAll('a[href]')].map(anchor => anchor.href).filter(value => {
        try { const next = new URL(value); return next.origin === url.origin && next.pathname === '/nyscef/DocumentList' && next.searchParams.get('docketId') === url.searchParams.get('docketId'); } catch { return false; }
      });
      return { url: url.href, html: table?.outerHTML ?? '', pagination };
    });
    const source = new URL(snapshot.url);
    if (source.origin !== 'https://iapps.courts.state.ny.us' || source.pathname !== '/nyscef/DocumentList' || !source.searchParams.get('docketId')) throw new Error('Open the exact NYSCEF DocumentList first');
    if (!snapshot.html) throw new Error('The docket table is unavailable. Resolve the court challenge in the supervised browser.');
    if (visited.has(snapshot.url)) break;
    visited.add(snapshot.url); pages.push(snapshot);
    if (pages.length > 20) throw new Error('Docket capture exceeded the page limit');
    queue.push(...snapshot.pagination.filter(url => !visited.has(url)));
    queue = [...new Set(queue)].filter(url => !visited.has(url));
    if (!queue.length) break;
    await tab.goto(queue.shift());
  }
  return { version: 1, sourceUrl: pages[0].url, observedAt: new Date().toISOString(), pages };
}
