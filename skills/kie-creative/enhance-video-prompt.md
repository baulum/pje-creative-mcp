# enhance-video-prompt

Transform a basic video idea into a professional, cinematic prompt optimized for high-quality video generation.

## Usage

```
/enhance-video-prompt "your video idea here"
```

## What It Does

Converts simple concepts into detailed video prompts with:
- **Specific camera movements** - Static/pan/dolly/rack focus with direction and speed
- **Realistic timing** - Duration, pacing breakdown, natural speeds
- **Cinematography language** - Film/documentary/commercial style references
- **Lighting scenarios** - Time of day, light direction, shadow quality
- **Material specifics** - Concrete textures, actual materials visible
- **Motion details** - Realistic gestures, authentic speeds, natural timing
- **Removed AI language** - No "cinematic", "stunning", "hyper-realistic"

## Examples

### Before: Coffee Scene
**Input:** "Someone making coffee"
**Output:** "White ceramic mug on wood counter. Water pours from kettle at realistic speed, steam rises. 
Camera static, watching pouring from 45-degree angle. Warm morning light (8am) from left creates shadows 
on counter. Real pouring physics. Matte ceramic finish visible. 6 seconds total. Documentary product 
photography style, warm color grading. Authentic hand steadiness, no artificial smoothness."

---

### Before: Workspace
**Input:** "Person working at desk"
**Output:** "Minimalist oak desk, laptop open. Person's hands type naturally at real-world pace on backlit 
keyboard. Camera pulls back slowly over 8 seconds, revealing entire workspace. Morning light (9am) streams 
from window left, creating defined shadows. Warm film aesthetic, slight grain. Real typing speed and natural 
hand position. Visible: desk texture, coffee mug with ring, scattered papers. Documentary production style, 
professional but authentic."

---

### Before: Exterior
**Input:** "Building shot"
**Output:** "Brick building facade with green ivy climbing. Camera pans slowly left to right over 12 seconds. 
Late afternoon light (3:30pm) at 45 degrees creates warm golden shadows across brick. Soft wind moves ivy 
leaves slightly. Real cloud movement overhead, light haze in distance. Neutral to cool color grading, 35mm 
cinematography. Smooth deliberate motion, no jarring cuts. Professional production, authentic weather 
conditions visible."

---

## Key Improvements You'll See

### Before Enhancement
- "Nice camera work and good lighting"
- "Professional video with cinematic feel"
- "Beautiful movements and stunning quality"

### After Enhancement
- "Slow pan left to right over 10 seconds"
- "Warm light from camera left at 45 degrees, soft shadows"
- "Static camera, hands type at natural rhythm, real typing speed"

### Result
More professional, authentic, cinematic videos that look intentional—not obviously AI-generated.

---

## Quick Reference: Camera Movements

- **Static** - No camera movement, fixed frame
- **Slow pan left** - Smooth horizontal movement left over X seconds
- **Slow pan right** - Smooth horizontal movement right over X seconds
- **Tilt up/down** - Smooth vertical camera rotation
- **Dolly in** - Camera moves toward subject slowly
- **Dolly out** - Camera moves away from subject slowly
- **Rack focus** - Focus shifts from foreground to background (or vice versa)
- **Push-in** - Slow push toward subject (emotional emphasis)

---

## Integration with MCP

Use the enhanced video prompt directly:

```
generate_video
model: kling/v3-turbo-text-to-video
prompt: [Enhanced prompt from /enhance-video-prompt]
duration: [specified in prompt]
aspect_ratio: 16:9 (for web/video) or 9:16 (for mobile)
resolution: 1080p
```

## Pro Tips

1. **Duration First** - Decide length before details (4-6s, 8-12s, 15s)
2. **Camera Movement Critical** - This defines the energy of the shot
3. **Avoid Fast Cuts** - Let shots breathe for authenticity
4. **Time of Day Matters** - Changes everything about light and mood
5. **Natural Timing** - Most AI fails on pacing/timing, specify realistic speeds
6. **Add Weather** - Wind, light changes, clouds = authenticity
7. **Include Imperfections** - Real videos show dust, reflections, real physics

---

## Before and After Comparison

| Aspect | Before Enhancement | After Enhancement |
|--------|-------------------|------------------|
| **Duration** | Not specified | "8 seconds total, 3 seconds pouring, 4 seconds holding, 1 second transition" |
| **Camera** | "Nice camera work" | "Static camera, no movement, watching from 45-degree angle" |
| **Motion** | "Good movements" | "Hands move at natural typing pace, real finger positions, natural speed" |
| **Lighting** | "Good lighting" | "Warm light from camera left at 45°, creates soft shadows on desk, golden hour quality" |
| **Style** | "Cinematic" | "Documentary production style, 35mm aesthetic, warm color grading, slight film grain" |
| **Details** | Generic | "Oak desk texture visible, ceramic matte finish, coffee cup with lip mark, scattered papers" |

---

## Workflow

1. **Start:** "Person working at desk with laptop"
2. **Enhance:** `/enhance-video-prompt "Person working at desk with laptop"`
3. **Get:** Complete video prompt with all specifications
4. **Use:** Paste into generate_video with appropriate model
5. **Review:** Video looks professional and authentic
6. **Iterate:** Adjust duration, lighting, or camera movement as needed

Start with the enhancement skill to get professional results immediately! 🎬✨
