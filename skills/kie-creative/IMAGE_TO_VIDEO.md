# Image-to-Video & Image Editing Prompts

Transform static images into cinematic videos or modify existing images with professional prompts.

## Image-to-Video: The Best Approach

**Image-to-Video is SUPERIOR to text-to-video because:**
- You control the exact framing and composition
- Ensures consistent visual style
- Reduces AI artifacts
- Faster generation
- More predictable results

## Workflow

1. **Generate perfect key frame** with `generate_image`
   - Use professional image prompts (see IMAGE_PROMPTS.md)
   - Get the exact look and composition you want

2. **Animate with image_to_video**
   - Reference that perfect image
   - Describe how it comes to life
   - Control exact motion

3. **Results**
   - Professional, controlled, consistent videos

---

## Image-to-Video Prompt Structure

```
[ANIMATION CONCEPT]
What should happen to the static image?

[CAMERA MOVEMENT]
How does camera move? (Often none for image-to-video)

[SUBJECT MOVEMENT]
What animates in the frame?
Realistic timing and speed

[DURATION]
How long the animation takes

[TIMING BREAKDOWN]
- Seconds 0-3: What happens?
- Seconds 3-6: What happens?
- Etc.

[STYLE NOTES]
Maintain the image's aesthetic
Continue the lighting and mood
Keep material/texture continuity

[MOTION QUALITY]
Realistic speed and physics
Natural gestures if people present
Authentic movement patterns
```

---

## Image-to-Video Examples

### Example 1: Coffee Scene Animation

**Starting Image (Generated with image_prompts):**
White ceramic mug on wood counter, morning light, steam

**Image-to-Video Prompt:**
"Animate the static coffee scene. Person's hand enters frame slowly from right, 
reaches for mug handle over 2 seconds. Pauses 1 second holding mug, then slowly 
lifts to lips for sip over 3 seconds. Set mug down gently. Total: 8 seconds. 
Keep warm morning light, shadows, and wood texture consistent. Hand movements 
natural and realistic, not rushed. Light should show steam rising from cup 
throughout. Maintain documentary photography aesthetic from original image."

**Result:**
- Perfect composition (controlled in image)
- Natural animation (controlled in video)
- Consistent style (maintained from base image)

---

### Example 2: Office Space Opening

**Starting Image (Generated):**
Minimalist office, morning light, laptop on desk

**Image-to-Video Prompt:**
"Camera slowly pulls back over 6 seconds, revealing more workspace. Laptop screen 
glows subtly. Person's hand appears holding coffee mug over 1 second, sets it down 
carefully. Light stays consistent—warm from window left. Dust particles visible in 
light beam. Hand movement slow and deliberate. Continue warm film aesthetic from 
original. No jarring cuts, smooth continuous motion. 10 seconds total."

**Result:**
- Clean framing established
- Professional animation added
- Consistent lighting and mood maintained

---

### Example 3: Exterior to Interior

**Starting Image (Generated):**
Sunlit room with large windows, exterior visible

**Image-to-Video Prompt:**
"Gentle camera push-in toward window over 8 seconds. Afternoon light (3pm) 
remains consistent. Slight cloud movement visible through glass. Interior 
shadows remain unchanged. Keep warm golden-hour quality throughout. No 
subjects moving, purely environmental animation—light quality, cloud movement, 
subtle wind-blown curtain edges if present. Documentary production style 
maintained. Smooth motion, not abrupt. Professional, understated."

**Result:**
- Hypnotic, slow, professional movement
- Perfect light consistency
- No distracting AI artifacts

---

## Image Editing Prompts

Edit prompts work best when **specific about what to change** and **describe what stays the same**.

### Edit Structure

```
[WHAT TO CHANGE]
Specific element to modify
Exactly what should be different

[WHAT TO KEEP]
Main scene/composition stays the same
Materials/textures remain consistent
Lighting direction unchanged
Color palette maintained

[SPECIFIC INSTRUCTIONS]
Be concrete about the change
Reference the original

[RESULT SHOULD]
Match the original aesthetic
Feel like natural modification
Maintain photorealistic quality
```

---

## Edit Examples

### Example 1: Remove & Replace

**Original Image:**
Office desk with dated computer monitor

**Edit Prompt:**
"Replace the dated computer monitor with a modern MacBook Pro laptop. Keep the 
desk, lighting, shadows, and surrounding workspace identical. The laptop should 
sit in exactly the same position where the monitor was. Maintain the warm morning 
light direction and desk material texture. Color palette should remain consistent 
with the original—warm wood tones, neutral shadows. The change should look natural, 
like the laptop was always there."

**Result:**
Modern, updated image while preserving original aesthetic

---

### Example 2: Time of Day Change

**Original Image:**
Midday office with harsh shadows

**Edit Prompt:**
"Change lighting to golden hour evening (5pm), warm and directional from the 
left. Adjust shadows to be longer and softer. Office layout and furniture stay 
identical. Reduce overall brightness to match evening conditions. Warm color 
grade—increased yellows and oranges. Materials and textures remain the same, 
just different light quality. Window still visible in background, now glowing 
with warm sunset light. No furniture moved, no objects added or removed."

**Result:**
Same scene, dramatically different mood and time of day

---

### Example 3: Style/Finish Change

**Original Image:**
Modern office with polished surfaces

**Edit Prompt:**
"Add weathering and authenticity to the office. Keep layout identical. Add subtle 
dust on surfaces, slight marks on walls, worn edges on furniture. Reduce over-sheen 
on surfaces to look more lived-in and real. Lighting and time of day stays the same. 
Keep all furniture in exact same position. The change should make it feel like a 
real, working office with authentic patina—not pristine and sterile. Same color 
palette, just more textured and authentic."

**Result:**
More believable, authentic office that doesn't look new/perfect

---

## Best Practices

### For Image-to-Video
✅ Start with perfect image (use generate_image first)
✅ Describe animation in terms of real physics
✅ Specify exact duration and pacing
✅ Reference the original image's aesthetic
✅ Use natural movement speeds
✅ Break down timing in sections
✅ Keep lighting and mood consistent

### For Image Editing
✅ Be specific about what changes
✅ Emphasize what stays the same
✅ Reference original materials/textures
✅ Describe result, not process
✅ Maintain lighting direction
✅ Keep composition structure
✅ Test with small changes first

### Avoid
❌ "Make it better"
❌ "Enhance the image"
❌ "Cinematic animation"
❌ Changing too many elements at once
❌ Vague descriptions
❌ Contradicting original aesthetic

---

## MCP Integration

### Image-to-Video Workflow
```
Step 1: generate_image (create perfect base image)
model: gpt-image-2-text-to-image
prompt: [Professional image prompt]
aspect_ratio: 16:9
↓
Step 2: image_to_video (animate it)
image: [URL from step 1]
prompt: [Image-to-video prompt with animation details]
duration: 8 (or as specified)
↓
Result: Professional cinematic video
```

### Image Editing Workflow
```
image: [Original image file or URL]
prompt: [Edit prompt specifying changes]
model: [Appropriate model for edit capability]
↓
Result: Modified image maintaining original aesthetic
```

---

## Advanced Tips

### Image-to-Video Stacking
Create sequence of videos:
1. Generate image
2. Create 8-second animation (first action)
3. Generate new image (modified state)
4. Create next 8-second animation (second action)
5. Combine videos in editor

Result: Complete scene with multiple choreographed actions

### Multi-Step Edits
1. Edit original for major change
2. Edit result for detail refinement
3. Continue until perfect

Result: Precisely controlled final image

### Style Consistency
- Always reference the original image
- Match lighting direction exactly
- Maintain texture and material appearance
- Keep color palette
- Preserve composition

Result: Professional, cohesive final product

---

## Quality Checklist

✅ Image base is professionally composed?
✅ Animation prompt describes realistic motion?
✅ Duration and pacing specified clearly?
✅ Original aesthetic preserved in animation?
✅ Timing breakdown included?
✅ Edit prompts specific about what changes?
✅ Edit prompts clear about what stays the same?
✅ All technical details included?
✅ No AI tropes in language?
✅ Ready to generate?

Use image-to-video for maximum control and professional results! 🎬✨
