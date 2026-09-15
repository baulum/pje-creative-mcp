# enhance-prompt

Transform a basic image prompt into a professional, photorealistic prompt optimized for high-quality image generation.

## Usage

```
/enhance-prompt "original prompt here"
```

## What It Does

Analyzes your image prompt and enhances it with:
- **Photography & film language** - adds camera, lens, and lighting techniques
- **Specific materials & textures** - replaces vague descriptions with concrete details
- **Atmospheric details** - adds time of day, season, lighting direction, mood
- **Authentic composition** - includes depth, focus techniques, framing
- **Removed AI tropes** - eliminates words that make images look obviously AI-generated

## Examples

### Architecture/Interior
**Input:** "A modern office"
**Output:** "A contemporary corporate workspace at late morning, natural light from floor-to-ceiling windows creating defined shadows on light wood desks. Shot with 35mm lens, sharp focus on desk foreground with bokeh windows, matte charcoal accent walls with brushed steel frames. Professional architectural photography, authentic materials visible—oak grain texture, concrete floor, fabric chairs in natural tones. No artificial enhancement, documentary-style lighting."

### Product/Commercial
**Input:** "A beautiful coffee cup"
**Output:** "Freshly poured coffee in a ceramic mug, steam rising in soft afternoon light from a north-facing window. Shot with macro lens at f/4, shallow depth of field with background blurred. Warm wood surface, slight rim lighting on the cup edge, natural saucer placement. Photography styled for lifestyle brand, captured film photography aesthetic with neutral color palette. Realistic texture of ceramic glaze visible, no overexposure."

### Lifestyle/Scene
**Input:** "Work from home setup"
**Output:** "Home office desk during golden hour, warm sunlight through sheer curtains creating diffused glow across laptop and notebooks. Natural materials: walnut desk, linen chair, vintage desk lamp. Shot with 50mm prime lens, shallow depth of field, candid workspace composition. Professional lifestyle photography, authentic clutter with purpose—coffee cup with lipstick mark, pages with handwritten notes, small plant with morning light hitting leaves. Documentary feel, subtle film grain."

## Pro Tips

1. **Always specify time of day** - Changes everything about lighting
2. **Name specific materials** - Oak, marble, steel, linen, ceramic
3. **Use photography terms** - "Shallow depth of field", "bokeh", "natural rim lighting"
4. **Add authentic details** - Dust particles, reflections, worn edges, realistic imperfections
5. **Reference style** - "Film photography aesthetic", "documentary style", "architectural photography"
6. **Avoid power words** - Skip "stunning", "beautiful", "hyper-realistic", "magical"

## Result

Your enhanced prompt is ready to use with:
- `generate_image` - For direct image generation
- `gpt-image-2-text-to-image` - For GPT Image 2.0 generation
- Any other image generation model in the MCP

## Integration with MCP

Use the enhanced prompt directly:
```
/enhance-prompt "Your idea here"
→ [Enhanced prompt appears]
→ Copy to clipboard
→ Use with generate_image tool
```

Or chain with generation:
```
generate_image with model: gpt-image-2-text-to-image
prompt: [Use enhanced version from above]
aspect_ratio: 16:9
```
