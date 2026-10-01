// Mirrors backend/apps/submissions/validators.py. The server re-checks everything;
// this just avoids uploading 10 MB before finding out the file is refused.
export const MAX_UPLOAD_MB = 10
const TEXT = ['.txt', '.md', '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.c', '.h', '.cpp', '.hpp', '.cs', '.go', '.rb', '.php', '.rs', '.kt', '.swift', '.sql', '.html', '.css', '.json', '.csv', '.xml', '.yml', '.yaml', '.sh', '.ipynb']
const BINARY = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.docx']
export const ACCEPT = [...TEXT, ...BINARY].join(',')

/** @returns {string|null} an error message, or null if the file looks acceptable */
export function checkUpload(file) {
  if (!file) return null
  const dot = file.name.lastIndexOf('.')
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : ''
  if (![...TEXT, ...BINARY].includes(ext)) return `“${ext || 'no extension'}” files are not accepted. Use PDF, ZIP, DOCX, an image, or a source/text file.`
  if (file.size === 0) return 'That file is empty.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is ${MAX_UPLOAD_MB} MB.`
  return null
}
