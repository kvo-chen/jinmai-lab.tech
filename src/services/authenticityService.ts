function tokenize(s: string) {
  const tokens: string[] = []
  const re = /([\u4e00-\u9fa5]+)|([a-zA-Z0-9]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (m[1]) {
      const t = m[1]
      if (t.length === 1) {
        tokens.push(t)
      } else {
        for (let i = 0; i < t.length - 1; i++) {
          tokens.push(t.slice(i, i + 2))
        }
      }
    } else if (m[2]) {
      tokens.push(m[2].toLowerCase())
    }
  }
  return tokens
}

function cosineSimilarity(a: string, b: string): number {
  const ta = tokenize(a)
  const tb = tokenize(b)
  const dict: Record<string, [number, number]> = {}
  ta.forEach(t => {
    dict[t] = dict[t] || [0, 0]
    dict[t][0] += 1
  })
  tb.forEach(t => {
    dict[t] = dict[t] || [0, 0]
    dict[t][1] += 1
  })
  let dot = 0, na = 0, nb = 0
  Object.values(dict).forEach(([x, y]) => {
    dot += x * y
    na += x * x
    nb += y * y
  })
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function scoreAuthenticity(input: string, knowledge: string): { score: number; feedback: string[] } {
  const sim = cosineSimilarity(input, knowledge)
  let score = Math.round(sim * 100)
  if (score === 0 && input.trim() && knowledge.trim()) {
    const ta = Array.from(new Set(tokenize(input)))
    const tb = Array.from(new Set(tokenize(knowledge)))
    const inter = ta.filter(t => tb.includes(t)).length
    const union = new Set([...ta, ...tb]).size
    const jaccard = union ? inter / union : 0
    score = Math.round(jaccard * 100)
  }
  if (score < 0) score = 0
  if (score > 100) score = 100
  const feedback: string[] = []
  if (score < 70) feedback.push('请加强传统元素表达')
  if (/麻花/.test(knowledge) && !/褶/.test(input)) feedback.push('请加传统褶数')
  return { score, feedback }
}

export default { scoreAuthenticity }
