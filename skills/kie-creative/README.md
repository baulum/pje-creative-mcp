# PJE Creative MCP Skills

Enhance your image generation workflow with professional prompt engineering and advanced techniques.

## Available Skills

### 📝 `enhance-prompt` 
Transform basic ideas into professional, photorealistic image prompts.

**Use when:** Your prompt sounds too generic or AI-like
**Benefit:** Generated images look more authentic, professional, and intentional

**Quick Start:**
```
/enhance-prompt "A modern office with good lighting"
```

**Result:**
Enhanced prompt ready to use with image generation tools.

---

## Prompt Engineering Principles

### ❌ Don't Write Like This
```
"A beautiful modern office with stunning lighting and amazing design"
```

### ✅ Write Like This Instead
```
"Minimalist corporate office captured during late morning light. 
Concrete floors with area rug, white oak desks, matte black steel frames. 
Shot with 35mm lens at f/2.8, natural depth of field, window light with defined shadows. 
Professional architectural photography, documentary aesthetic, neutral color palette."
```

### Key Differences
| Aspect | ❌ Avoid | ✅ Use |
|--------|---------|--------|
| **Descriptors** | "stunning", "amazing", "beautiful" | Specific materials: oak, marble, steel |
| **Resolution** | "4K", "8K", "hyper-detailed" | Photography technique: "35mm lens", "shallow DOF" |
| **Style** | "photorealistic" | "Documentary photography", "film aesthetic" |
| **Atmosphere** | "magical", "ethereal" | Time/light: "golden hour", "afternoon shadows" |
| **Mood** | "beautiful vibes" | "Authentic materials visible", "natural imperfections" |

---

## Prompt Structure Template

Use this structure for maximum realism:

```
[SCENE & SUBJECT]
{Main element, context, setting}

[LOCATION & TIME]
{Where it is, what time of day, season}

[MATERIALS & TEXTURES]  
{Specific materials with actual names}

[LIGHTING & ATMOSPHERE]
{Direction, quality, time-based light}

[PHOTOGRAPHY TECHNIQUE]
{Lens, aperture, depth of field, focus}

[STYLE & MOOD]
{Photography style, film aesthetic, mood}

[COMPOSITION]
{Framing, angles, depth, foreground/background}

[NEGATIVE DIRECTIVES]
{Avoid plastic appearance, no oversaturation, etc.}
```

### Example Complete Prompt

```
A home office desk in late morning sunlight. 
Workspace at a window, warm natural light creating defined shadows.
Walnut desk, vintage brass lamp, ceramic mug with remnant coffee ring.
Shot with 50mm prime lens at f/4, shallow depth of field.
Documentary lifestyle photography, candid moment, 35mm film aesthetic.
Soft natural light across notebook pages and keyboard.
Authentic worn surfaces visible, subtle dust in light beam.
No artificial enhancement, neutral color grading with warm undertones.
```

---

## Photography Language Reference

### Lighting Terms
- **Golden hour** - Warm, directional light at sunrise/sunset
- **Rim lighting** - Light coming from behind subject edges
- **Diffused light** - Soft light through sheer material or clouds
- **Natural shadows** - Sharp-edged shadows from direct sun
- **Ambient light** - Overall surrounding light without harsh direction

### Camera/Lens Terms
- **35mm/50mm lens** - Standard, natural perspective
- **24mm lens** - Wide angle for spaces
- **Shallow depth of field** - Blurred background (f/1.8-2.8)
- **Sharp focus** - Everything in focus (f/8+)
- **Bokeh** - Blurred background lights/highlights

### Photography Styles
- **Documentary photography** - Authentic, candid, real-world
- **Film photography** - Warm tones, slight grain, organic feel
- **Architectural photography** - Clean lines, geometric, professional
- **Lifestyle photography** - Natural moments, authentic living
- **Candid** - Unposed, genuine moments

### Material Names (Specific!)
Instead of: "Modern materials"
Use: "Brushed stainless steel", "white oak veneer", "matte ceramic", "linen upholstery"

---

## Common Mistakes & Fixes

### Mistake: Generic Adjectives
```
❌ "A beautiful, stunning home office with amazing lighting"
✅ "Home office with afternoon sunlight through tall windows, authentic wooden desk"
```

### Mistake: AI Clichés
```
❌ "Hyper-realistic, ultra-detailed, 8K, octane render"
✅ "Professional photography, documentary style, 50mm lens"
```

### Mistake: Vague Descriptions
```
❌ "Modern design with good colors"
✅ "Minimalist aesthetic with warm oak tones and neutral grays, natural color palette"
```

### Mistake: Overusing Power Words
```
❌ "Ethereal, magical, breathtaking landscape"
✅ "Golden hour light across mountain valley, strong contrast shadows, dramatic sky"
```

### Mistake: Missing Technical Details
```
❌ "A nice office photo"
✅ "Office photographed with 35mm lens, shallow depth of field, documentary style"
```

---

## Pro Workflow

1. **Start with your idea**
   ```
   "A coffee shop setup for working"
   ```

2. **Enhance with /enhance-prompt**
   ```
   /enhance-prompt "A coffee shop setup for working"
   ```

3. **Get optimized prompt**
   ```
   "Coffee shop corner table during mid-morning, natural light from large windows.
   Weathered wood table, ceramic coffee cup with latte foam ring, open laptop.
   Shot with 50mm lens, shallow depth of field, warm film photography aesthetic.
   Candid lifestyle photography, authentic moment, natural color grading."
   ```

4. **Generate with MCP**
   ```
   generate_image
   model: gpt-image-2-text-to-image
   prompt: [paste enhanced prompt]
   aspect_ratio: 16:9
   ```

5. **Review & iterate**
   - If too much warmth: add "neutral color grading"
   - If needs more detail: add material specifics
   - If too perfect: add "subtle imperfections", "authentic wear"

---

## Results You'll See

### Better Images Have:
✅ Realistic textures and materials
✅ Authentic lighting (not glowing/surreal)
✅ Natural composition (not symmetrical perfection)
✅ Proper color grading (not oversaturated)
✅ Professional execution (not "AI-obvious")
✅ Specific details (visible in textures, materials, props)

### You'll Avoid:
❌ Plastic, fake-looking surfaces
❌ Oversaturated colors  
❌ Perfect symmetry/balance
❌ Generic "AI aesthetic"
❌ Blown-out or too-dark areas
❌ Impossible physics

---

## Integration with MCP

The enhanced prompts work with all image models:
- `gpt-image-2-text-to-image` - Excellent for photorealism
- `gpt-image-2-5-flare-text-to-image` - High quality, sharp details
- `gpt-image-2-5-sunburst-text-to-image` - Creative, stylized
- All other text-to-image models in the MCP

### Example MCP Usage
```
Using generate_image tool:
- model: gpt-image-2-text-to-image
- prompt: [Your enhanced prompt from /enhance-prompt]
- aspect_ratio: 16:9 (for web/video)
- aspect_ratio: 1:1 (for social media)
- aspect_ratio: 9:16 (for mobile/stories)
```

---

## Resources

- **PROMPT_ENHANCEMENT.md** - Detailed enhancement methodology
- **enhance-prompt** - Skill to automatically enhance your prompts
- **generate_image** - MCP tool documentation with examples

Start with small improvements. Your prompts will get better with practice!
