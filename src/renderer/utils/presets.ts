import type { Preset } from '../types';

export const defaultPresets: Preset[] = [
  // Upscaler presets
  {
    id: 'topaz-photo',
    name: 'Topaz Photo AI',
    category: 'upscaler',
    model: 'llava:latest',
    prompt: `Analyze this image for upscaling optimization. Describe:
1. Image type (photo, illustration, screenshot, etc.)
2. Main subjects and their positions
3. Texture details that should be preserved
4. Areas with fine details (hair, fabric, text)
5. Background complexity
6. Suggested Topaz Photo AI settings: Autopilot mode or Manual adjustments
7. Face recovery needed: yes/no
8. Noise level: low/medium/high
9. Sharpening recommendation: light/standard/strong`,
    options: {
      temperature: 0.3,
      top_p: 0.9,
      num_predict: 512,
      num_ctx: 4096,
    },
    description: 'Optimized for Topaz Photo AI upscaling analysis',
  },
  {
    id: 'topaz-video',
    name: 'Topaz Video AI',
    category: 'upscaler',
    model: 'llava:latest',
    prompt: `Analyze this frame for video upscaling. Describe:
1. Content type (live action, animation, game footage, etc.)
2. Motion characteristics (fast/slow, camera movement)
3. Compression artifacts visible
4. Interlacing issues
5. Suggested Topaz Video AI model: Proteus, Gaia, Artemis, or Iris
6. Frame interpolation needed: yes/no
7. Stabilization recommended: yes/no
8. Grain handling: preserve/reduce/remove`,
    options: {
      temperature: 0.3,
      top_p: 0.9,
      num_predict: 512,
      num_ctx: 4096,
    },
    description: 'Optimized for Topaz Video AI frame analysis',
  },
  {
    id: 'topaz-gigapixel',
    name: 'Topaz Gigapixel',
    category: 'upscaler',
    model: 'llava:latest',
    prompt: `Analyze this image for extreme upscaling with Gigapixel AI. Describe:
1. Source image quality (excellent/good/fair/poor)
2. Original resolution estimation
3. Detail complexity level
4. Edge definition quality
5. Suggested AI model: Standard, High Fidelity, Art & CG, or Low Resolution
6. Face enhancement needed: yes/no
7. Recommended scale factor: 2x/4x/6x
8. Noise reduction level: none/low/medium/high
9. Blur removal needed: yes/no`,
    options: {
      temperature: 0.3,
      top_p: 0.9,
      num_predict: 512,
      num_ctx: 4096,
    },
    description: 'Optimized for Topaz Gigapixel AI analysis',
  },
  {
    id: 'supir',
    name: 'SUPIR Upscaler',
    category: 'upscaler',
    model: 'llava:latest',
    prompt: `Analyze this image for SUPIR restoration and upscaling. Provide:
1. Degradation type: blur, noise, compression, low resolution, or mixed
2. Content category: face, landscape, architecture, product, artwork
3. Semantic description for restoration guidance (50-100 words)
4. Key elements that must be preserved
5. Suggested CFG scale: 1.0-3.0
6. Restoration strength: light (0.3), medium (0.5), strong (0.7)
7. Color correction needed: yes/no
8. Detail enhancement areas`,
    options: {
      temperature: 0.5,
      top_p: 0.9,
      num_predict: 600,
      num_ctx: 4096,
    },
    description: 'Detailed analysis for SUPIR restoration model',
  },
  
  // Generator presets
  {
    id: 'flux-dev',
    name: 'Flux Dev',
    category: 'generator',
    model: 'llava:latest',
    prompt: `Create a detailed prompt for Flux Dev image generation based on this reference. Include:
1. Main subject with precise details
2. Art style and medium
3. Lighting conditions
4. Camera angle and composition
5. Color palette
6. Mood and atmosphere
7. Background elements
8. Quality tags: masterpiece, high quality, detailed

Format as a single paragraph prompt suitable for Flux.`,
    options: {
      temperature: 0.7,
      top_p: 0.95,
      num_predict: 400,
      num_ctx: 4096,
    },
    description: 'Generate prompts for Flux Dev model',
  },
  {
    id: 'flux-schnell',
    name: 'Flux Schnell',
    category: 'generator',
    model: 'llava:latest',
    prompt: `Create a concise but effective prompt for Flux Schnell based on this image. Focus on:
1. Core subject (keep it simple)
2. Key visual style
3. Main colors
4. Essential composition elements

Keep the prompt under 100 words for optimal Schnell performance.`,
    options: {
      temperature: 0.6,
      top_p: 0.9,
      num_predict: 200,
      num_ctx: 4096,
    },
    description: 'Optimized short prompts for Flux Schnell',
  },
  {
    id: 'sdxl',
    name: 'SDXL',
    category: 'generator',
    model: 'llava:latest',
    prompt: `Analyze this image and create an SDXL-optimized prompt. Include:

POSITIVE PROMPT:
- Subject description with details
- Style tags (photorealistic, anime, illustration, etc.)
- Quality tags (masterpiece, best quality, high resolution)
- Lighting and atmosphere
- Composition elements

NEGATIVE PROMPT suggestions:
- Common artifacts to avoid
- Style exclusions if any

Format clearly with POSITIVE: and NEGATIVE: sections.`,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 500,
      num_ctx: 4096,
    },
    description: 'Full positive/negative prompts for SDXL',
  },
  {
    id: 'sd15',
    name: 'SD 1.5',
    category: 'generator',
    model: 'llava:latest',
    prompt: `Create a Stable Diffusion 1.5 compatible prompt from this image:

POSITIVE:
- Main subject with comma-separated tags
- Style and quality modifiers
- Artist style references if applicable
- Lighting and color tags

NEGATIVE:
- worst quality, low quality, bad anatomy, bad hands
- Add specific exclusions based on image type

Use tag-based format with commas.`,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 400,
      num_ctx: 4096,
    },
    description: 'Tag-based prompts for SD 1.5 and checkpoints',
  },
  {
    id: 'nai-diffusion',
    name: 'NovelAI Diffusion',
    category: 'generator',
    model: 'llava:latest',
    prompt: `Create a NovelAI Diffusion V3 prompt based on this image:

Tags (comma-separated, most important first):
1. Character description tags
2. Pose and action tags
3. Clothing and accessories
4. Background and setting
5. Art style tags
6. Quality tags: masterpiece, best quality, amazing quality

Undesired Content suggestions:
- lowres, bad anatomy, bad hands, text, error
- Add specific exclusions

Use Danbooru-style tags where applicable.`,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      num_predict: 450,
      num_ctx: 4096,
    },
    description: 'Danbooru-style tags for NovelAI',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    category: 'generator',
    model: 'llava:latest',
    prompt: `Create a Midjourney prompt based on this image:

Describe the image as a Midjourney prompt with:
1. Subject description in natural language
2. Style references (e.g., "in the style of...")
3. Medium (photography, digital art, oil painting, etc.)
4. Lighting description
5. Mood/atmosphere

Add suggested parameters:
--ar (aspect ratio)
--style (raw, or version specific)
--stylize (0-1000)

Format as a single flowing prompt with parameters at the end.`,
    options: {
      temperature: 0.7,
      top_p: 0.95,
      num_predict: 350,
      num_ctx: 4096,
    },
    description: 'Natural language prompts for Midjourney',
  },
  
  // Qwen presets
  {
    id: 'qwen-detailed',
    name: 'Qwen Detailed',
    category: 'general',
    model: 'qwen2-vl:latest',
    prompt: `Provide a comprehensive analysis of this image:

1. OVERVIEW: Brief one-sentence summary
2. SUBJECTS: Main elements and their descriptions
3. COMPOSITION: Layout, framing, visual hierarchy
4. COLORS: Dominant palette and color relationships
5. LIGHTING: Type, direction, quality, mood
6. STYLE: Artistic style, medium, technique
7. CONTEXT: Setting, time period, narrative elements
8. TECHNICAL: Image quality, resolution indicators
9. NOTABLE DETAILS: Unique or interesting elements`,
    options: {
      temperature: 0.5,
      top_p: 0.9,
      num_predict: 1024,
      num_ctx: 8192,
    },
    description: 'Comprehensive analysis with Qwen2-VL',
  },
  {
    id: 'qwen-ocr',
    name: 'Qwen OCR',
    category: 'general',
    model: 'qwen2-vl:latest',
    prompt: `Extract and transcribe all text visible in this image:

1. List all text exactly as it appears
2. Note the position/location of each text element
3. Identify text type (title, label, caption, handwritten, etc.)
4. Note any text that is partially visible or unclear
5. Preserve formatting where possible (lists, paragraphs)

If no text is present, describe what the image contains instead.`,
    options: {
      temperature: 0.2,
      top_p: 0.9,
      num_predict: 2048,
      num_ctx: 8192,
    },
    description: 'Text extraction and OCR with Qwen2-VL',
  },
  
  // General presets
  {
    id: 'quick-describe',
    name: 'Quick Description',
    category: 'general',
    model: 'llava:latest',
    prompt: 'Describe this image in 2-3 sentences, focusing on the main subject and overall impression.',
    options: {
      temperature: 0.5,
      top_p: 0.9,
      num_predict: 150,
      num_ctx: 4096,
    },
    description: 'Fast, concise image descriptions',
  },
  {
    id: 'detailed-analysis',
    name: 'Detailed Analysis',
    category: 'general',
    model: 'llava:latest',
    prompt: `Provide a thorough analysis of this image:

1. Main subject and focal point
2. Composition and visual elements
3. Color palette and mood
4. Lighting and shadows
5. Background and context
6. Style and artistic elements
7. Any text or symbols present
8. Overall impression and purpose`,
    options: {
      temperature: 0.6,
      top_p: 0.9,
      num_predict: 800,
      num_ctx: 4096,
    },
    description: 'In-depth image analysis',
  },
  {
    id: 'caption-social',
    name: 'Social Media Caption',
    category: 'general',
    model: 'llava:latest',
    prompt: `Create an engaging social media caption for this image:

1. Catchy opening hook
2. Description that tells a story
3. Relevant emoji suggestions
4. 5-10 relevant hashtag suggestions

Keep it authentic and engaging, suitable for Instagram/Twitter.`,
    options: {
      temperature: 0.8,
      top_p: 0.95,
      num_predict: 300,
      num_ctx: 4096,
    },
    description: 'Generate social media captions',
  },
  {
    id: 'alt-text',
    name: 'Alt Text Generator',
    category: 'general',
    model: 'llava:latest',
    prompt: `Generate accessible alt text for this image suitable for screen readers:

1. Start with the most important element
2. Be concise but descriptive (125 characters ideal, 250 max)
3. Avoid "image of" or "picture of"
4. Include relevant text shown in image
5. Describe colors only if meaningful
6. Note the function/purpose if applicable

Provide both a short version (under 125 chars) and an extended description.`,
    options: {
      temperature: 0.3,
      top_p: 0.9,
      num_predict: 300,
      num_ctx: 4096,
    },
    description: 'Accessibility-focused alt text',
  },
  {
    id: 'inpainting-mask',
    name: 'Inpainting Guide',
    category: 'generator',
    model: 'llava:latest',
    prompt: `Analyze this image for inpainting/editing:

1. Identify areas that might need editing
2. Describe what's currently in those areas
3. Suggest what could replace/improve them
4. Recommend mask boundaries
5. Provide a prompt for the replacement content

Format:
AREA: [description of area to edit]
CURRENT: [what's there now]
SUGGESTED: [what to replace with]
PROMPT: [generation prompt for new content]`,
    options: {
      temperature: 0.6,
      top_p: 0.9,
      num_predict: 500,
      num_ctx: 4096,
    },
    description: 'Guide for inpainting and image editing',
  },
];

export const visionModels = [
  { name: 'llava:latest', displayName: 'LLaVA 1.6', description: 'General purpose vision model' },
  { name: 'llava:13b', displayName: 'LLaVA 13B', description: 'Larger LLaVA model' },
  { name: 'llava:34b', displayName: 'LLaVA 34B', description: 'Largest LLaVA model' },
  { name: 'llava-llama3:latest', displayName: 'LLaVA Llama3', description: 'LLaVA with Llama 3' },
  { name: 'llava-phi3:latest', displayName: 'LLaVA Phi3', description: 'Lightweight LLaVA' },
  { name: 'bakllava:latest', displayName: 'BakLLaVA', description: 'Mistral-based vision model' },
  { name: 'moondream:latest', displayName: 'Moondream', description: 'Fast, lightweight vision' },
  { name: 'qwen2-vl:latest', displayName: 'Qwen2-VL', description: 'Qwen vision-language model' },
  { name: 'qwen2-vl:7b', displayName: 'Qwen2-VL 7B', description: 'Medium Qwen vision model' },
  { name: 'qwen2-vl:72b', displayName: 'Qwen2-VL 72B', description: 'Large Qwen vision model' },
  { name: 'minicpm-v:latest', displayName: 'MiniCPM-V', description: 'Efficient vision model' },
  { name: 'nanollava:latest', displayName: 'NanoLLaVA', description: 'Tiny vision model' },
];

export const presetCategories = [
  { id: 'upscaler', name: 'Upscalers', icon: '⬆️' },
  { id: 'generator', name: 'Generators', icon: '🎨' },
  { id: 'general', name: 'General', icon: '📝' },
  { id: 'custom', name: 'Custom', icon: '⚙️' },
];
