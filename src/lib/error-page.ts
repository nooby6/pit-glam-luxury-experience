export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fcfbf7; color: #171717; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 36rem; width: 100%; text-align: center; padding: 2rem; border-radius: 1.5rem; background: rgba(255, 255, 255, 0.82); border: 1px solid rgba(23, 23, 23, 0.08); box-shadow: 0 30px 80px -30px rgba(23, 23, 23, 0.25); }
      .eyebrow { letter-spacing: .32em; text-transform: uppercase; font-size: .72rem; color: #b8892f; margin: 0 0 1rem; }
      h1 { font-size: 1.9rem; line-height: 1.1; margin: 0 0 0.75rem; }
      p { color: #525252; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.8rem 1.2rem; border-radius: 999px; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #171717; color: #fff; }
      .secondary { background: #fff; color: #171717; border-color: rgba(23, 23, 23, 0.12); }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="eyebrow">Rendering failed</p>
      <h1>This page didn't load</h1>
      <p>Something went wrong while rendering the site. You can try again or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
