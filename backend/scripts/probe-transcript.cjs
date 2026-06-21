/**
 * Local YouTube transcript probe (no server required).
 * Usage: npm run probe:transcript -- <youtube-url>
 */
const { probeTranscript } = require('../dist/infrastructure/transcript/fetch-transcript-probe')

const videoUrl = process.argv[2]
const lang = process.argv[3] ?? 'en'

if (!videoUrl) {
  console.error('Usage: npm run probe:transcript -- <youtube-url> [lang]')
  process.exit(1)
}

probeTranscript(videoUrl, lang)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2))
  })
  .catch((error) => {
    const payload = {
      success: false,
      error: error.message,
      code: error.code
    }

    if (error.attempts) {
      payload.attempts = error.attempts
    }

    console.error(JSON.stringify(payload, null, 2))
    process.exit(1)
  })
