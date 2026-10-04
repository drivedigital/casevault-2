# Document previews

The original viewer embedded the private file endpoint in an iframe and relied on the browser's native PDF plugin. The in-app browser displayed a blank panel even though the authenticated endpoint returned the correct original bytes.

PDFs now render inside CaseVault with pinned PDF.js 6.4.299. The renderer fetches the original through the existing authenticated endpoint, draws one page at a time, and provides previous/next page controls, zoom, loading/error states and an original download link. It does not require completed OCR. PDF page counts come from the actual loaded file.

The PDF worker, character maps, standard fonts and decoder assets are served from the application's own origin, prepared from the locked dependency during development/build. No evidence is sent to an external preview service. The original-file endpoint retains authentication and sandbox response headers. The download query requests an attachment disposition.

PNG, JPEG, GIF, WebP and AVIF originals with those content types render as local images. Small plain-text, CSV and JSON files render as escaped text. Other formats show a download option instead of a blank iframe; Office conversion is not implemented by this change. SVG and HTML are not executed inline.

This is a visual original-file preview. Extracted text search, selectable PDF text, annotation and evidence highlights remain separate work.
