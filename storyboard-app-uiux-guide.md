# UI/UX Design Specification & Inspiration Guide
## Storyboard Generator Mobile App

---

## 1. App Overview & User Flow

**Core flow:** User creates a new storyboard video → inputs story description (scene, characters, mood) → optionally uploads character image → selects visual style (5 options) → selects number of frames (1–15) → generates storyboard.

---

## 2. Design Direction

### Recommended Aesthetic: **Dark Creative Studio**
A dark-mode-first interface with cinematic depth. Think of it as a filmmaker's tool that feels premium, immersive, and creative — not clinical or generic.

### Theme & Color Palette

**Primary background:** Deep charcoal `#0D0D0F` to `#1A1A2E` (NOT pure black — use dark grays for depth)
**Surface/card color:** `#1E1E2A` with subtle elevation using lighter overlays
**Primary accent:** Electric violet `#7C5CFC` or cinematic amber `#F5A623` — pick ONE dominant accent
**Secondary accent:** Soft cyan `#4ECDC4` for secondary actions and highlights
**Text primary:** `#F0F0F5` (off-white, easier on eyes than pure white)
**Text secondary:** `#8888A0`
**Success/generating state:** `#00D68F`
**Error:** `#FF6B6B`
**Gradients:** Use subtle gradient meshes on key surfaces — e.g., a very faint purple-to-blue glow behind the main CTA

### Typography

**Display / Headers:** Use a bold, cinematic typeface — suggestions:
- **"Clash Display"** (Indian Type Foundry) — geometric, bold, modern
- **"Cabinet Grotesk"** — clean with personality
- **"Satoshi"** — warm geometric sans
- **"Plus Jakarta Sans"** — rounded, friendly but professional

**Body text:** Pair with a highly legible sans:
- **"General Sans"** or **"Switzer"**

**DO NOT USE:** Inter, Roboto, Arial, SF Pro as primary. These are generic and forgettable.

**Type scale:** Use a modular scale (1.25 ratio):
- Hero title: 32px bold
- Section headers: 24px semibold
- Body: 16px regular
- Caption/label: 13px medium
- Micro text: 11px

### Spacing System
Use an 8px grid. All spacing should be multiples of 8:
- Section padding: 24px or 32px
- Card padding: 16px
- Element gaps: 8px, 12px, 16px
- Screen horizontal margins: 20px

---

## 3. Screen-by-Screen Design Specifications

### 3.1 Home / Projects Screen

**Layout:** Vertical scroll with a staggered grid of past projects (like Pinterest but 2 columns). Each card shows a thumbnail of the first generated frame with the project title overlaid at the bottom using a gradient scrim.

**Key elements:**
- Top bar: App logo (left), user avatar (right), minimal
- Floating action button (FAB) at bottom-right: "+" icon with a glowing accent shadow to create a new storyboard
- Empty state: Show a cinematic illustration with text "Your stories begin here" and a prominent "Create First Storyboard" button
- Cards should have rounded corners (16px radius), subtle border (`1px solid rgba(255,255,255,0.06)`), and a hover/press scale animation (0.97 scale on press, spring back)

**Micro-interactions:**
- Cards fade in with staggered delay on load (50ms between each)
- Pull-to-refresh with a custom film-reel spinner animation
- Long-press a card to reveal delete/duplicate options with haptic feedback

**Inspiration reference:** Look at how **Runway ML** (runway.com) handles their project gallery — dark, minimal, content-forward. Also see **Luma AI's** mobile app for project card styling.

---

### 3.2 New Storyboard — Story Input Screen

This is the most important screen. It needs to feel like a creative workspace, not a boring form.

**Layout:** Full-screen dark background. Use a step indicator at the top (not a boring progress bar — use numbered circles connected by a thin line, with the active step glowing).

**Step 1: Story Description**

**Scene input:** Large text area with placeholder text that types itself (animated placeholder): *"A lonely astronaut discovers a garden on Mars..."*
- Text area should have a subtle inner glow border on focus
- Background: slightly lighter surface `#1E1E2A`
- Min height: 120px, expands as user types
- Character count indicator (subtle, bottom-right)

**Characters input:** Pill-shaped tag input. User types a character name and hits enter to create a tag.
- Tags should be colorful pills with auto-assigned colors from a curated palette
- Each tag has a tiny "×" to remove
- Add a "+" button to add more characters

**Mood selector:** NOT a text input. Use a horizontal scroll of mood cards:
- Each card: icon + label (e.g., 🎭 Dramatic, 😊 Joyful, 😰 Tense, 🌙 Dreamy, 💀 Dark, 🎉 Energetic)
- Selected state: card scales up slightly, border changes to accent color, subtle glow
- Allow multi-select (some stories mix moods)
- Cards should be pill-shaped or rounded rectangles with icon + text

**Micro-interactions:**
- Typing in text area: subtle pulse on the step indicator
- Adding a character tag: tag pops in with a spring animation
- Selecting a mood: haptic tap + card glow animation

---

### 3.3 Character Image Upload (Optional)

**Layout:** A dedicated card/section within the flow (or a collapsible section).

**Design:**
- Dashed-border upload area with a camera/image icon in the center
- Text: "Upload a reference image for character consistency (optional)"
- On upload: show a circular crop preview of the image with a subtle pulsing border
- Allow removing/replacing the image
- If skipped, show a subtle AI-generated silhouette placeholder

**Animation:** Image uploads with a circular reveal animation from center outward.

---

### 3.4 Visual Style Selection

This screen should feel like an art gallery.

**Layout:** Horizontal carousel OR a 2×3 grid of style cards. Each card is a visual example (not just text).

**5 Visual Styles (example):**
1. **Cinematic** — moody lighting, film grain, realistic
2. **Anime** — vibrant, cel-shaded, expressive
3. **Watercolor** — soft, painterly, dreamy
4. **Comic Book** — bold lines, halftone dots, dynamic
5. **Sketch** — pencil/charcoal, raw, storyboard-traditional

**Card design:**
- Each card: ~160px tall, full-width or grid item
- Background: a sample image in that style
- Style name overlaid at bottom with gradient scrim
- Selected state: thick accent border (3px), scale 1.02, checkmark badge in corner
- Unselected: subtle desaturated look (80% opacity)

**Micro-interactions:**
- Tapping a style card: slight bounce animation + border glow
- Transitioning between styles: crossfade the sample image

**Inspiration:** See how **Midjourney** handles style selection — visual-first, minimal text. Also reference **Canva's** style picker in their Magic Studio.

---

### 3.5 Frame Count Selector

**Design:** A custom slider, NOT a default system slider.

**Custom slider:**
- Track: rounded, dark surface with a gradient fill from left to current position (accent color)
- Thumb: large circle (44px tap target minimum) with the current number displayed inside
- Below the slider: visual representation — small frame thumbnails that dynamically appear/disappear as user slides (tiny rectangles in a row, like a film strip)
- Film strip metaphor: show a horizontal strip of empty frame placeholders that fill in as the count increases

**Labels:** "1 frame" on left, "15 frames" on right
**Default value:** 6 frames (sweet spot)

**Micro-interactions:**
- Sliding: haptic tick at each integer
- Frame thumbnails pop in/out with spring animation as count changes
- Number in thumb updates with a digit-roll animation

---

### 3.6 Generate / Review Screen

**Before generation:**
- Summary card showing all selections: story preview (truncated), characters (as tags), mood, style thumbnail, frame count
- Each section is editable (tap to go back to that step)
- Large "Generate Storyboard" CTA button at bottom
- Button style: full-width, rounded (12px), accent gradient background, bold white text, subtle shadow

**During generation:**
- Full-screen takeover with a cinematic loading experience
- NOT a boring spinner. Instead:
  - Show a progress bar styled as a film strip being developed
  - Animated text cycling through creative messages: "Composing scenes...", "Painting your world...", "Adding drama..."
  - Subtle particle effect or moving gradient in background
  - Show frames appearing one by one as they generate (progressive reveal)

**After generation:**
- Frames displayed in a scrollable vertical list or horizontal filmstrip
- Each frame: full-width image with frame number badge
- Bottom bar: "Save", "Share", "Regenerate" actions
- Tap any frame to see it full-screen with pinch-to-zoom

---

## 4. Component Design System

### Buttons
- **Primary:** Accent gradient fill, rounded (12px), 48px height, bold text, shadow
- **Secondary:** Transparent with 1px accent border, same shape
- **Ghost:** No border, accent text only, for tertiary actions
- **All buttons:** Press state scales to 0.96, spring back. Loading state shows a small spinner replacing text.

### Input Fields
- Background: `#1A1A2E` (slightly lighter than page)
- Border: `1px solid rgba(255,255,255,0.08)`, on focus: `accent color`
- Border radius: 12px
- Padding: 16px horizontal, 14px vertical
- Label: above the field, 13px medium, secondary text color
- Placeholder: `#555570`, italic

### Cards
- Background: `#1E1E2A`
- Border: `1px solid rgba(255,255,255,0.06)`
- Border radius: 16px
- Shadow: `0 4px 24px rgba(0,0,0,0.3)`
- Padding: 16px
- Press animation: scale(0.97) → spring back

### Tags / Chips
- Background: accent color at 15% opacity
- Text: accent color
- Border radius: 20px (pill shape)
- Padding: 6px 14px
- Remove button: small "×" icon, same color

### Bottom Navigation (if applicable)
- Frosted glass effect: `backdrop-filter: blur(20px)` with semi-transparent dark background
- 3-4 icons max: Home, Create (center, larger), Projects, Settings
- Active state: filled icon + accent color, label visible
- Inactive: outline icon + secondary text color

---

## 5. Animation & Interaction Principles

### Page Transitions
- Use shared element transitions where possible (e.g., project card thumbnail → full project view)
- Default: slide from right for forward navigation, slide from left for back
- Modals: slide up from bottom with a spring curve

### Loading States
- Skeleton screens for content loading (NOT spinners for lists)
- Shimmer effect: subtle gradient sweep across skeleton placeholders
- For generation: custom cinematic loading (see section 3.6)

### Scroll Behaviors
- Parallax on hero elements (subtle, 0.3 rate)
- Sticky headers that shrink/blur on scroll
- Pull-to-refresh with custom animation

### Haptic Feedback
- Light tap: selecting options, toggling
- Medium impact: confirming actions (generate, save)
- Success notification: custom pattern

---

## 6. Key Inspiration Sources to Explore

### Direct Competitors (Study Their UX Flow)
| App | What to Learn |
|-----|--------------|
| **Katalist.ai** | Script-to-storyboard flow, character consistency UI, style selection |
| **Boords** | Frame management, collaboration UI, export options |
| **Shai Creative** | Visual style options, AI generation feedback |
| **StoryTribe** | Drag-and-drop frame reordering |

### Design Pattern References (Study Their Visual Quality)
| App/Site | What to Learn |
|----------|--------------|
| **Runway ML** (runway.com) | Dark creative tool UI, project gallery, generation states |
| **Luma AI** | Mobile-first creative tool, clean dark UI |
| **Kling AI** | Video generation UI, prompt input design |
| **Midjourney** | Style selection, image generation feedback, prompt UX |
| **Canva Mobile** | Approachable creative tool, template browsing, style pickers |
| **Figma Mobile** | Touch-first creative interactions, gesture navigation |
| **CapCut** | Video editing mobile UX, timeline/frame management |

### UI Inspiration Galleries
| Site | Best For |
|------|----------|
| **mobbin.com** | Real mobile app screenshots by screen type (onboarding, dark mode, etc.) |
| **dribbble.com/tags/ai-mobile-app** | Conceptual AI app UI designs |
| **theappfuel.com** | Full user flow screenshots from top App Store apps |
| **pageflows.com** | Video recordings of real app flows |
| **nicelydone.club** | Micro-interaction and transition inspiration |

### Design Trend References
- **Dark mode best practices:** Use `#121212` or `#0D0D0F` as base, not pure black. Elevated surfaces get lighter. Use desaturated accent colors. Material Design 3 dark theme guidelines are excellent.
- **Glassmorphism:** Frosted glass effects on overlays and bottom bars (`backdrop-filter: blur(20px)` + semi-transparent bg)
- **Micro-interactions:** Subtle scale animations on press (0.96-0.98), spring physics for bouncy feels, staggered list item entry
- **Bento grid layouts:** Asymmetric card grids like iOS widgets — great for the home/projects screen

---

## 7. Claude Code Implementation Notes

When sharing this with Claude Code, ask it to:

1. **Implement dark mode first** — this is the primary theme. Light mode can come later.
2. **Use a design token system** — define all colors, spacing, typography, and border radius as tokens/variables so the entire theme can be adjusted from one file.
3. **Prioritize these animations** (in order of impact):
   - Page/screen transitions (shared element where possible)
   - Button press feedback (scale + haptic)
   - List item staggered entry
   - Loading/generation state
   - Mood/style card selection feedback
4. **Typography matters more than you think** — load a custom font (Clash Display or Satoshi from fontsource or Google Fonts) and use it for headers. This alone will transform the feel.
5. **Touch targets:** Minimum 44×44px for all interactive elements.
6. **Film strip motif:** Use as a recurring visual metaphor — frame numbers, the slider, loading states, project thumbnails.

### Sample Prompt for Claude Code
```
Redesign the UI of my storyboard generator mobile app following this design 
specification. The app should feel like a premium filmmaker's tool — dark mode, 
cinematic, with thoughtful micro-interactions. Use [framework] with the following 
design tokens: [paste color palette and typography from this guide]. Focus on 
the [specific screen] first. Reference the component specifications in the guide 
for buttons, inputs, cards, and navigation.
```

---

## 8. Quick Wins (Do These First)

If you need fast improvement with high impact:

1. **Switch to dark mode** with proper surface elevation (not just "make it black")
2. **Replace system fonts** with Clash Display (headers) + General Sans (body)
3. **Add press animations** to all buttons and cards (scale 0.96, 150ms spring)
4. **Increase border radius** to 12-16px on cards and inputs
5. **Add a frosted glass bottom bar** instead of a solid navigation bar
6. **Use accent color sparingly** — one dominant accent, not a rainbow
7. **Add skeleton loading states** instead of spinners
8. **Increase spacing** — most amateur apps feel cramped. Add more breathing room.

---

*This guide is designed to be shared directly with Claude Code or any AI coding assistant to implement a professional-grade UI/UX overhaul.*
