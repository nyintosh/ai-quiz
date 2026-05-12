import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `Analyze quiz images. Output ONLY valid JSON, no markdown.

If a multiple choice question is visible:
{"question":"full question text","options":["A. option","B. option","C. option","D. option"],"answer":"A","explanation":"brief reason"}

"answer" is one letter: A, B, C, or D.
No question visible: {"question":null}`

export async function POST(req: Request) {
  const { image } = await req.json()

  if (!image || typeof image !== 'string') {
    return Response.json({ error: 'Missing image' }, { status: 400 })
  }

  let base64Data = image
  let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'

  if (image.startsWith('data:')) {
    const [header, data] = image.split(',')
    base64Data = data
    const match = header.match(/data:([^;]+)/)
    if (match && (match[1] === 'image/png' || match[1] === 'image/webp')) {
      mediaType = match[1] as typeof mediaType
    }
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
        ],
      },
    ],
  })

  const text = (response.content[0] as { type: 'text'; text: string }).text.trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return Response.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
    parsed = JSON.parse(match[0])
  }

  return Response.json(parsed)
}
