# Provador de Cores v2 — Simulação na mão da usuária

Este documento explica as opções para evoluir o provador de cores da v1 (SVG estático)
para a v2, onde a usuária **tira uma foto da própria mão** (ou envia uma) e a cor do
esmalte é simulada sobre as unhas reais dela.

Estão cobertas: a opção com **Gemini (paga)** e várias **alternativas gratuitas**,
com prós/contras, custos, complexidade e trechos de código.

---

## Sumário das abordagens

| # | Abordagem | Custo | Onde roda | Usa a mão REAL? | Qualidade |
|---|-----------|-------|-----------|-----------------|-----------|
| A | **MediaPipe Hands + Canvas** (recomendada) | Grátis | Navegador (client) | ✅ Sim | Boa |
| B | **OpenCV.js** (heurística por cor) | Grátis | Navegador (client) | ✅ Sim | Média |
| C | **Pollinations.ai** (Stable Diffusion grátis) | Grátis | Servidor | ❌ Gera sintética | Alta |
| D | **Hugging Face Inference API** (SD + ControlNet) | Grátis (tier) | Servidor | ⚠️ img2img | Alta |
| E | **Gemini / Imagen** (Google) | Pago | Servidor | ❌ Gera sintética | Muito alta |

**Recomendação:** começar pela **abordagem A (MediaPipe)** — é gratuita, instantânea,
roda 100% no navegador, usa a mão real da cliente e não tem custo de API. Reservar a
geração de imagem por IA (C, D ou E) como recurso premium opcional.

---

## Abordagem A — MediaPipe Hands + Canvas (GRÁTIS, recomendada)

### Como funciona
1. A usuária abre a câmera (ou envia uma foto) da própria mão.
2. O modelo **MediaPipe Hands** (do Google, open source) detecta **21 pontos**
   (landmarks) da mão em tempo real, diretamente no navegador via WebGL.
3. A partir dos landmarks, calculamos a região de cada unha (5 dedos) — cada unha
   fica entre a ponta do dedo e a articulação distal.
4. Desenhamos uma máscara/elipse sobre cada unha em um `<canvas>` sobreposto à foto.
5. A cor da máscara = cor de esmalte escolhida, com `globalCompositeOperation = 'multiply'`
   (ou `'source-atop'` + opacidade) para preservar brilho/sombra da unha real.

### Prós
- **100% gratuito**, sem chave de API, sem custos por uso.
- **Instantâneo** (roda em ~30ms por frame no celular moderno).
- **Privado**: a foto nunca sai do dispositivo da cliente.
- Funciona **ao vivo** (preview da câmera) ou com foto enviada.
- Já é a arquitetura que deixamos preparada na v1 (`ImageSource` + `ColorApplier`).

### Contras
- Qualidade depende da iluminação/ângulo da foto.
- Detecção de unhas via landmarks é aproximada (não segmenta o contorno exato).
- Pode falhar se a mão estiver muito de lado ou borrada.

### Dependências
```bash
bun add @mediapipe/hands @mediapipe/camera_utils @mediapipe/drawing_utils
```

### Código — esqueleto do ColorApplier v2

```tsx
// src/components/client/hand-capture-applier.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { Hands, HAND_CONNECTIONS, Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

interface Props { corHex: string }

export function HandCaptureApplier({ corHex }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const hands = new Hands({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    })
    hands.setOptions({ maxNumHands: 1, modelComplexity: 1 })
    hands.onResults(onResults)

    async function start() {
      if (!videoRef.current) return
      const camera = new Camera(videoRef.current, {
        onFrame: async () => { await hands.send({ image: videoRef.current! }) },
        width: 640, height: 480,
      })
      await camera.start()
      setReady(true)
    }
    start()
  }, [])

  function onResults(results: Results) {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    if (results.multiHandLandmarks?.length) {
      const lm = results.multiHandLandmarks[0]
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = 0.75
      ctx.fillStyle = corHex
      // para cada dedo, desenha elipse na ponta (unha)
      const tips = [4, 8, 12, 16, 20]   // polegar, indicador, médio, anelar, mínimo
      const pips = [3, 6, 10, 14, 18]   // articulação distal de cada dedo
      for (let i = 0; i < 5; i++) {
        const tip = lm[tips[i]]
        const pip = lm[pips[i]]
        const cx = (tip.x + pip.x) / 2 * canvas.width
        const cy = (tip.y + pip.y) / 2 * canvas.height
        const w = Math.hypot(tip.x - pip.x, tip.y - pip.y) * canvas.width * 0.9
        const h = w * 0.6
        const angle = Math.atan2(tip.y - pip.y, tip.x - pip.x)
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
    }
    ctx.restore()
  }

  return (
    <div className="relative aspect-[4/3]">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas ref={canvasRef} width={640} height={480} className="w-full rounded-2xl" />
      {!ready && <p className="absolute inset-0 grid place-items-center text-sm">Iniciando câmera…</p>}
    </div>
  )
}
```

### Integração com a v1 atual
A v1 já tem a abstração `ImageSource` (wrapper) + `ColorApplier` (método de aplicação).
Basta criar um novo `ColorApplier` que usa MediaPipe no lugar do SVG estático, e um novo
`ImageSource` que usa `<video>` (câmera) no lugar do SVG. A tela `client-color-tester.tsx`
não precisa mudar — só trocar os componentes injetados.

### Suporte a foto enviada (não só câmera ao vivo)
Para foto enviada, em vez de `Camera`, rode `hands.send({ image: imgElement })` uma vez:
```ts
const img = new Image()
img.src = URL.createObjectURL(file)
await img.decode()
await hands.send({ image: img })
```

---

## Abordagem B — OpenCV.js (GRÁTIS, heurística por cor)

### Como funciona
Carrega o OpenCV compilado para WebAssembly. Detecta a unha por **segmentação por cor
de pele** + contornos, sem modelo de ML. Aplica a cor com blend mode.

### Prós
- Grátis, client-side.
- Não depende de download de modelo (mais leve que MediaPipe para o inicial).

### Contras
- **Muito menos preciso** que MediaPipe — detecção de unha por cor/contorno é frágil
  (varia com pele, iluminação, esmalte pré-existente).
- OpenCV.js é pesado (~8MB).
- Mais código de tuning.

### Quando usar
Só se a MediaPipe não for viável. Na prática, recomendamos pular esta opção.

---

## Abordagem C — Pollinations.ai (GRÁTIS, geração sintética)

### Como funciona
A [Pollinations.ai](https://pollinations.ai) oferece **geração de imagem gratuita**
sem chave de API. Você monta uma URL e ela retorna a imagem gerada por Stable Diffusion.

```
https://image.pollinations.ai/prompt/{prompt-encoded}?width=512&height=512&nologo=true
```

### Prós
- **Grátis**, sem chave, sem cadastro.
- Integração trivial (é só um `<img>` com URL).
- Qualidade alta (Stable Diffusion).

### Contras
- **Não usa a mão real** da cliente — gera uma mão sintética com a cor escolhida.
- Latência ~5-15s por imagem.
- Sem controle fino do resultado (sem img2img, sem ControlNet).
- Pode sair do ar / rate limit não documentado.

### Código
```tsx
function GeneratedHand({ corNome, corHex }: { corNome: string; corHex: string }) {
  const prompt = encodeURIComponent(
    `close-up photo of a woman's hand with neatly manicured nails painted in ${corNome} (${corHex}) nail polish, natural skin, soft studio lighting, high detail, realistic`
  )
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${Date.now()}`
  return <img src={url} alt={corNome} className="rounded-2xl" />
}
```

---

## Abordagem D — Hugging Face Inference API (GRÁTIS com tier)

### Como funciona
A HF oferece [Inference API gratuita](https://huggingface.co/inference-api) para modelos
open source (Stable Diffusion, SDXL, Flux). Com um token grátis (cadastro), você chama
o endpoint e recebe a imagem. Suporta **img2img** e **ControlNet** — então dá para usar
a foto da mão da cliente como base e repintar as unhas.

### Prós
- Grátis no tier inicial (~1000 requisições/mês dependendo do modelo).
- Suporta **img2img com ControlNet** → preserva a estrutura da mão real.
- Modelos de última geração (SDXL, Flux schnell).

### Contras
- Precisa cadastro + token (não pode ficar no client sem expor o token).
- Rate limit no tier grátis; pode ter fila.
- Maior complexidade (upload da foto base + máscara + prompt).

### Código (server-side, Next.js API route)
```ts
// src/app/api/provador/gerar/route.ts
export async function POST(req: Request) {
  const { corNome, fotoBase64 } = await req.json()
  const res = await fetch(
    'https://api-inference.huggingface.co/models/stablediffusionapi/realvisxl-v40',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `woman hand, nails painted ${corNome} nail polish, realistic photo, ${fotoBase64}`,
      }),
    }
  )
  const blob = await res.blob()
  return new Response(blob, { headers: { 'Content-Type': 'image/png' } })
}
```

---

## Abordagem E — Gemini / Imagen (PAGA, mais simples)

### Como funciona
O **Gemini API** do Google oferece geração de imagem via modelo **Imagen** (e edição via
Gemini 2.0 Flash com capacidade de imagem). Você manda um prompt de texto (e opcionalmente
uma imagem base para edição) e recebe a imagem gerada.

### Prós
- Qualidade **muito alta** e consistente.
- Suporta **edição de imagem** (mandar a foto da mão + prompt "pinte as unhas de vermelho").
- SDK simples (o `z-ai-web-dev-sdk` já dá acesso a esses modelos neste projeto).

### Contras
- **Pago** após o tier grátis (Gemini tem free tier limitado; Imagen é cobrado por imagem).
- Não usa exatamente a mão real — é uma regeneração.
- Latência alguns segundos.

### Quando vale a pena
Se a qualidade da simulação for diferencial de produto e o orçamento permitir. Caso
contrário, a abordagem A (MediaPipe) entrega 90% do valor a custo zero.

### Código com z-ai-web-dev-sdk (já disponível no projeto)
```ts
// src/app/api/provador/gemini/route.ts
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: Request) {
  const { corNome, fotoBase64 } = await req.json()
  const zai = await ZAI.create()

  const res = await zai.images.generations.create({
    model: 'gemini-2.0-flash-exp-image-generation',
    prompt: `Edit this hand photo: repaint all five fingernails with ${corNome} nail polish, keep everything else identical. Photo: ${fotoBase64}`,
    size: '1024x1024',
  })

  return Response.json({ url: res.data?.[0]?.url })
}
```
> ⚠️ Confirme os nomes exatos dos modelos e a disponibilidade de edição de imagem na
> documentação atual do SDK — eles mudam com frequência.

---

## Comparativo de custo (estimativa para 1000 simulações/mês)

| Abordagem | Custo estimado |
|-----------|----------------|
| A — MediaPipe | R$ 0 |
| B — OpenCV.js | R$ 0 |
| C — Pollinations | R$ 0 (sujeito a indisponibilidade) |
| D — Hugging Face | R$ 0 no tier grátis, depois ~US$ 0.001/imagem |
| E — Gemini/Imagen | ~US$ 0.02–0.04 por imagem (Gemini 2.0 Flash) |

---

## Recomendação final para este projeto

1. **Curto prazo (grátis, valor rápido):** implementar a **Abordagem A (MediaPipe)**
   como evolução do provador v1. Mantém a arquitetura desacoplada que já existe
   (`ImageSource` + `ColorApplier`), só troca a implementação. Custo zero, instantâneo,
   usa a mão real.

2. **Médio prazo (opcional, premium):** oferecer um botão "Gerar visualização em alta
   qualidade" que usa **Abordagem D (Hugging Face)** ou **E (Gemini)** para clientes que
   queiram uma imagem fotorrealista. Pode ser pago/premium para cobrir o custo.

3. **Não recomendado:** Abordagem B (OpenCV.js) — esforço alto, qualidade baixa vs. MediaPipe.

### Passos concretos para implementar a Abordagem A
1. `bun add @mediapipe/hands @mediapipe/camera_utils`
2. Criar `src/components/client/hand-capture-applier.tsx` (código acima).
3. Na `client-color-tester.tsx`, substituir o `HandModelSVG` (estático) pelo
   `HandCaptureApplier` quando a usuária ativar "Usar minha câmera".
4. Adicionar um seletor: **Mão-modelo (v1)** | **Minha câmera (v2)** | **Enviar foto (v2)**.
5. Para "Enviar foto", usar `<input type="file" accept="image/*">` + `hands.send({ image })`.
6. Testar em dispositivo real (a câmera precisa de HTTPS — o preview já está em HTTPS).

### Privacidade
Com a Abordagem A, **nenhuma imagem sai do dispositivo** — a foto é processada
localmente no navegador. Isso é um diferencial de privacidade que pode ser destacado
no marketing da plataforma.

---

## Referências
- MediaPipe Hands: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
- MediaPipe Web (JS): https://github.com/google-ai-edge/mediapipe
- Pollinations.ai: https://pollinations.ai
- Hugging Face Inference API: https://huggingface.co/docs/api-inference
- Gemini API (imagem): https://ai.google.dev/gemini-api/docs/image-generation
- z-ai-web-dev-sdk (já no projeto): ver `skills/` e o SDK instalado em `node_modules`
