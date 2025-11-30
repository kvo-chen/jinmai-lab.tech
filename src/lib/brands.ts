export interface Brand {
  id: string
  name: string
  story: string
  image: string
}

const mkImg = (prompt: string, size: 'landscape_16_9' | 'square' = 'landscape_16_9') =>
  `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`

export const BRANDS: Brand[] = [
  {
    id: 'guifaxiang',
    name: '桂发祥十八街麻花',
    story:
      '源自清末的天津风味代表，以多褶形态与香酥口感著称，沿袭手作工艺与津味记忆，承载城市味道与技艺传承，百年老字号与年轻创意不断融合。',
    image: mkImg('SDXL, Tianjin Guifaxiang Shibajie mahua, traditional Chinese snack photography, red and gold accents, studio lighting, high detail, cultural motif'),
  },
  {
    id: 'erduoyan',
    name: '耳朵眼炸糕',
    story:
      '以糯米与红豆为主料，外酥里糯、香甜不腻，街巷烟火与市井风味的象征，凝聚天津人情味与老字号精神，口碑与故事历久弥新。',
    image: mkImg('SDXL, Tianjin Erduoyan zha gao, traditional snack, street food vibe, warm tone, cultural atmosphere, high detail'),
  },
  {
    id: 'guorenzhang',
    name: '果仁张',
    story:
      '精选坚果与传统技法相结合，香酥适口、回味悠长，承载节令习俗与团圆记忆，老味道焕新表达，成为伴手礼与城市名片。',
    image: mkImg('SDXL, Tianjin Guoren Zhang nuts snack, product shot, festive red packaging, cultural pattern, studio lighting'),
  },
  {
    id: 'nirenzhang',
    name: '泥人张',
    story:
      '以细腻彩塑著称，人物生动传神，艺术与民俗交融的代表，见证天津手艺与美学传承，滋养城市文化与现代创意表达。',
    image: mkImg('SDXL, Tianjin Niren Zhang clay figurines, museum display, warm lighting, traditional art, cultural heritage'),
  },
]

export default BRANDS
