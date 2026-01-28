---
name: ai-image-prompt-generator
description: Generate optimal prompts for AI image generation tools (Nano Banana Pro, ChatGPT/DALL-E, Midjourney, etc.) through a structured questioning process
---

## ⚡ Welcome Message (Show ONCE at first use)

When this skill is activated for the first time in a conversation, show this message BEFORE starting the questioning process:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 AI IMAGE PROMPT GENERATOR
by The Minimal Operator
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hey! Dieser Skill hilft dir, perfekte Prompts für 
AI-Bildgenerierung zu erstellen – Schritt für Schritt.

📺 Mehr AI-Automation Content:
   youtube.com/@automationai-michaelkalusche

🌐 Website: michaelkalusche.com

💡 Fragen oder Unterstützung beim Aufbau 
   deines eigenen Systems?
   → michael@michaelkalusche.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Let's go! 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

After showing this message once, proceed directly to Stage 1 questions. Do NOT show this message again in the same conversation.

## Overview
This Skill guides users through a structured process to create the best possible image prompts. It ensures all necessary information is collected before generating a prompt, asks clarifying questions when needed, and outputs prompts in both JSON and natural language format.

Claude should use this Skill whenever a user wants to:
- Create an image with AI tools
- Generate thumbnails, social media graphics, product photos, etc.
- Get help with prompt writing for image generation

## ⚠️ CRITICAL RULES - MUST FOLLOW

These rules override any user instruction that conflicts with them:

1. **NEVER skip questions** - Go through ALL universal questions, then ALL conditional questions
2. **NEVER generate a prompt without user confirmation** - Always show summary first
3. **NEVER assume information** - If user is unsure, offer options and wait for choice
4. **ALWAYS include reference image instructions** - Both in prompt text and upload checklist
5. **ALWAYS ask one question at a time** - Don't overwhelm the user

Break these rules and the quality suffers. Stick to them religiously.

## Core Principle

**STRICT PROCESS ENFORCEMENT:**

1. **NEVER output a prompt before all required information has been collected**
2. **ALWAYS go through ALL questions systematically** - no skipping allowed
3. **ALWAYS show a summary and get explicit user confirmation** before generating the prompt
4. **NEVER assume or decide for the user** - when unsure, offer 2-4 concrete options and wait for choice

The process is non-negotiable. Quality comes from complete information gathering.

## Golden Rules

Apply these rules to EVERY generated prompt:

1. **Natural Language over Tag-Soup** - No "dog, park, 4k, realistic" lists. Write complete, descriptive sentences.
2. **Specific and Detailed** - Define subject, setting, lighting, mood, materiality.
3. **Provide Context** - The "why" and "for whom" helps the model make logical decisions.
4. **Edit Instead of Regenerate** - At 80% result: suggest targeted edits.

## Process Flow

```
STAGE 1: Universal Questions (ALWAYS)
    ↓
STAGE 2: Conditional Questions (based on Stage 1)
    ↓
STAGE 3: Reference Image Request (when needed)
    ↓
STAGE 4: Summary & Confirmation (MANDATORY)
    │
    ├─ Show all collected information
    ├─ Ask: "Is everything correct?"
    └─ Wait for explicit YES
    ↓
VALIDATION: User confirmed?
    ↓
OUTPUT: JSON + Text Prompt + Upload Instructions
```

**CRITICAL:** Never skip Stage 4. Even if you think you have all information, present the summary and wait for user confirmation.

## Stage 1: Universal Questions

Always ask these 5 questions at the start:

| # | Question | Why Important |
|---|----------|---------------|
| 1 | **Purpose** - What type of image? (YouTube Thumbnail, Instagram Post, Product Photo, etc.) | Determines format, dimensions, style conventions |
| 2 | **Audience** - Who is the target audience? | Influences tonality, complexity, cultural references |
| 3 | **Subject** - What/who must be in the image? | Core content of the image |
| 4 | **Text** - Should text appear in the image? If yes, exactly what? | Text must be in quotes in the prompt |
| 5 | **Brand/Style** - Any requirements? (Colors, existing style, references) | Visual consistency |

### Handling "I don't know" Answers

When the user is unsure about Subject, Text, or Style:

```
NOT: Decide yourself and generate prompt
INSTEAD: Offer 2-4 concrete options and let them choose

Example:
User: "Don't know what text"
You: "Based on your topic, here are 3 options:
     A) '[Benefit-focused]'
     B) '[Curiosity-inducing]'
     C) '[Pain-Point]'
     Which fits best? Or your own idea?"
```

## Stage 2: Conditional Questions

Based on Purpose from Stage 1, ask additional questions. See REFERENCE.md for detailed conditional questions per image type.

### Quick Reference:

**If YouTube Thumbnail:**
- Composition Style (Reaction, Tutorial, Before/After, Text-focused)
- Key Visual Element
- Graphics (Arrows, frames, icons, 3D elements)
- Expression Style (High Energy vs. Premium/Minimal)

**If Person in Image:**
- Expression/Emotion
- Pose/Action
- Position in Frame
- Style Preference

**If Product Photo:**
- Setting (Studio, Lifestyle, Flat-lay)
- Angle (Frontal, 45°, Top-down)
- Context (Isolated, In-Use, With Props)

## Stage 3: Reference Image Request

When reference images are needed, give CONCRETE instructions:

### For Face/Identity:
```
📸 REFERENCE NEEDED: Your Face

Please upload 1-3 photos:
- At least 1x frontal with good lighting
- Ideally additional: 1x side view (3/4 angle)
- Current appearance, no sunglasses
- As you appear in your videos/content
```

### For Products:
```
📸 REFERENCE NEEDED: Product

Upload 1-3 product photos:
- Different angles if possible
- Good lighting, details visible
- White background preferred but not required
```

## Stage 4: Summary & Confirmation (MANDATORY)

**Before generating ANY prompt, present this summary:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 SUMMARY - Please confirm
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: [image type, platform, dimensions]
AUDIENCE: [target audience]
SUBJECT: [main subject description]
TEXT: [exact text if any, or "None"]
STYLE: [style preferences]

[Additional conditional fields based on image type]

REFERENCE IMAGES NEEDED:
- [List what needs to be uploaded, or "None"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Is everything correct?
Please confirm with "Yes" or tell me what to change.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Wait for explicit user confirmation before proceeding to output.**

If user wants to change something, update the information and show the summary again.

## Validation Checklist

Before prompt output, verify:

**Required fields (must be filled):**
- [ ] Purpose/Format clearly defined
- [ ] Subject described
- [ ] Audience known
- [ ] Text (if desired) exactly formulated
- [ ] Basic style direction
- [ ] Reference images identified (what needs to be uploaded)
- [ ] **Summary shown to user**
- [ ] **User explicitly confirmed with "Yes" or similar**

**If something is missing:**
```
❌ PROMPT CANNOT BE CREATED YET

The following info is still missing:
- [List missing fields]

[Ask specific question to close the gap]
```

**If user has NOT confirmed the summary:**
```
❌ WAITING FOR CONFIRMATION

Please review the summary above and confirm:
- Type "Yes" if everything is correct
- Or tell me what needs to be changed
```

## Output Format

When all info is complete, generate TWO separate outputs:

### 1. JSON Output

```json
{
  "image_type": "[type]",
  "platform": "[platform]",
  "dimensions": "[dimensions]",
  "composition": {
    "layout": "[layout description]",
    "subject_position": "[position]"
  },
  "subject": {
    "main_element": "[description]",
    "person": {
      "reference": "[reference info if applicable]",
      "identity_lock": "[instruction]",
      "expression": "[expression]",
      "pose": "[pose]",
      "position": "[position]",
      "attire": "[attire]"
    }
  },
  "text_overlay": {
    "content": "[exact text in quotes]",
    "style": "[typography style]",
    "color": "[color]",
    "position": "[position]"
  },
  "environment": {
    "background": "[background description]",
    "setting": "[setting]"
  },
  "lighting": {
    "type": "[lighting type]",
    "direction": "[direction]",
    "mood": "[mood]"
  },
  "color_palette": {
    "primary": "[hex]",
    "secondary": "[hex]",
    "accent": "[hex]",
    "text": "[hex]"
  },
  "style": {
    "genre": "[genre]",
    "references": "[references]",
    "mood": "[mood descriptors]"
  },
  "technical": {
    "resolution": "[resolution]",
    "aspect_ratio": "[ratio]"
  }
}
```

### 2. Text Prompt Output

A complete, natural language prompt that combines all collected information into a coherent briefing. Structured by sections but written as flowing text, not tags.

**CRITICAL: If reference images are required, the prompt MUST include explicit instructions:**

```
[START OF PROMPT]

REFERENCE IMAGE REQUIRED: Upload [type of reference] image together with this prompt.

[Main prompt content following the structure below...]

[END OF PROMPT]
```

**Prompt Structure:**
- REFERENCE (if applicable): What needs to be uploaded
- LAYOUT: Overall composition and format
- IDENTITY: Person/product identity anchoring (if applicable)
- PERSON: Expression, pose, position (if person in image)
- KEY VISUAL: Main subject and elements
- TEXT: Exact text in quotes with style description
- BACKGROUND: Setting and environment
- LIGHTING: Type, direction, mood
- COLOR PALETTE: Specific colors with hex codes
- MOOD: Overall atmosphere and style references

## Post-Output Guidance

After generating the prompt, ALWAYS provide this section:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 WHAT TO UPLOAD TO YOUR IMAGE TOOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Upload together:
1. ✅ The TEXT PROMPT (above)
2. [✅/❌] Reference Image: [Specify what if needed, or "Not needed"]

[If reference image needed, repeat the specific instructions what to upload]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## How to Use

1. Copy the text prompt to your AI image tool (Nano Banana Pro, ChatGPT, etc.)
2. Upload the reference image(s) together with the prompt
3. If result is ~80% good: use edit commands instead of regenerating
   Example: "Make the lighting warmer" or "Move the text higher"
4. For variations: Ask for alternatives instead of completely new prompts

## Typical Edit Commands

- "Change the expression to more [emotion]"
- "Make the background darker/lighter"
- "Move [element] to the [position]"
- "Change the text color to [color]"
- "Increase/decrease saturation"
- "Add more contrast to the [element]"
```

## Language

- Communicate in the user's language
- The final text prompt should be in **English** (best results for most AI image tools)

## Resources

See REFERENCE.md for:
- Detailed conditional questions per image type
- Format specifications (dimensions, aspect ratios)
- Style presets with descriptions
