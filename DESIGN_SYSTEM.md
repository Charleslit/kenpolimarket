# Blockcert Afrika Design System

## Design Philosophy

### Core Principles
1. **Unique & Custom** - No generic templates or overused icon-based layouts
2. **Professional** - Clean, data-driven aesthetic for serious analytics
3. **No "Vibecoded" Look** - Avoid purple gradients and trendy AI template aesthetics
4. **Data-First** - Visual elements should reflect data and analytics focus

## Color System

### Primary Colors
```
Deep Charcoal: #1a1a1a (Primary text, borders, backgrounds)
White: #ffffff (Backgrounds, text on dark)
```

### Kenya Flag Accent Colors
```
Red: #BB0000 (Political division accent)
Black: #000000 (Secondary accent)
Green: #006600 (Future health/budget division accent)
```

### Neutral Grays
```
Gray 50: #f9fafb (Light backgrounds)
Gray 100: #f3f4f6 (Subtle backgrounds)
Gray 200: #e5e7eb (Borders)
Gray 400: #9ca3af (Disabled text)
Gray 500: #6b7280 (Secondary text)
Gray 600: #4b5563 (Body text)
Gray 900: #1a1a1a (Headings, primary text)
```

### Usage Guidelines
- **Primary Actions:** Gray 900 background, white text
- **Division Accents:** Use Kenya flag colors sparingly
  - Political: Red (#BB0000)
  - Budget: Green (#006600) 
  - Health: Black (#000000)
- **Borders:** 2px solid borders, no rounded corners on major elements
- **Backgrounds:** White or very light gray, no gradients

## Typography

### Font Stack
```css
Primary: var(--font-geist-sans) (Geist Sans)
Monospace: var(--font-geist-mono) (Geist Mono)
Fallback: Arial, Helvetica, sans-serif
```

### Type Scale
```
Hero (h1): 5xl-7xl (48px-72px), font-bold, tracking-tight
Section (h2): 3xl-4xl (30px-36px), font-bold
Subsection (h3): xl-2xl (20px-24px), font-bold, font-semibold
Body Large: lg-xl (18px-20px)
Body: base (16px)
Small: sm (14px)
Tiny: xs (12px)
```

### Typography Rules
- **Headings:** Bold weight, tight tracking for impact
- **Body:** Regular weight, relaxed leading for readability
- **Labels:** Semibold, uppercase for section headers
- **Data/Stats:** Bold, large size for emphasis

## Layout System

### Grid Structure
```
Max Width: 7xl (1280px)
Padding: px-4 sm:px-6 lg:px-8
Columns: 1 (mobile), 2-3 (tablet), 3-4 (desktop)
Gap: 4-8 (16px-32px)
```

### Spacing Scale
```
Tight: 4-6 (16px-24px)
Normal: 8-12 (32px-48px)
Loose: 16-20 (64px-80px)
Section: 20-32 (80px-128px)
```

### Layout Patterns
- **Hero Sections:** Full-width, centered content, generous vertical padding
- **Content Sections:** Max-width container, alternating white/gray backgrounds
- **Cards:** 2px borders, no shadows (or subtle on hover), no rounded corners
- **Grids:** Equal-height cards, consistent gaps

## Visual Elements

### Kenya Flag Brand Mark
```
Three vertical bars:
- Width: 1px (small), 0.5 (tiny accent)
- Heights: 6-12 (24px-48px)
- Colors: Red, Black, Green (in order)
- Usage: Logo, section dividers, accents
```

### Geometric Patterns
```css
/* Subtle background pattern */
opacity: 0.05
pattern: Small geometric grid
color: Black (#000000)
```

### Data Visualization Accents
```
Line charts: Simple polylines
Data points: Small circles (3-4px radius)
Colors: Monochrome with strategic accent colors
Usage: Hero sections, about pages, decorative elements
```

### Borders & Dividers
```
Standard: 2px solid
Color: Gray 200 (#e5e7eb)
Accent: 4px solid with Kenya flag colors
Usage: Cards, sections, emphasis
```

## Component Patterns

### Division Cards
```
Structure:
- 2px border with division accent color
- White background
- Padding: 8 (32px)
- Stats grid at bottom
- "Coming Soon" badge if inactive

States:
- Default: Border with accent color
- Hover: Shadow-lg (active only)
- Disabled: opacity-75, cursor-not-allowed
```

### Feature Boxes
```
Structure:
- 2px border gray-200
- Hover: border-gray-900
- No icons, use bullet points with accent colors
- Clear hierarchy: title, description, list

Content:
- Title: xl, font-bold
- Description: sm, text-gray-600
- List items: Accent bullet + text
```

### Stat Boxes
```
Structure:
- 2px border
- White background
- Centered content

Content:
- Number: 3xl, font-bold, gray-900
- Label: sm, font-semibold, gray-900
- Sublabel: xs, text-gray-500
```

### Buttons & CTAs
```
Primary:
- bg-gray-900, text-white
- px-6-8, py-3-4
- font-medium
- hover:bg-gray-800
- No rounded corners or minimal rounding

Secondary:
- border-2 border-gray-900
- text-gray-900
- hover:bg-gray-50

Link Style:
- text-gray-900, font-medium
- hover:underline
- Arrow indicator →
```

## Navigation Design

### Desktop Navigation
```
Structure:
- White background
- Shadow-md
- Sticky top-0
- Height: 16 (64px)

Logo:
- Kenya flag bars + wordmark
- Division badge (when in division)

Menu Items:
- Text-sm, font-medium
- Hover: text-gray-900
- Active: font-semibold

Dropdown:
- White background
- Border, shadow-lg
- Organized sections
```

### Mobile Navigation
```
Structure:
- Hamburger icon (☰)
- Full-width dropdown
- Organized by sections
- Clear hierarchy

Sections:
- Main navigation
- Division links
- Coming soon items
- API/resources
```

## Footer Design

### Structure
```
Background: bg-gray-900
Text: White/gray-400
Padding: py-12

Grid: 4 columns (desktop), 1 column (mobile)

Sections:
1. Company info + brand mark
2. Divisions list
3. Platform links
4. Resources

Bottom bar:
- Copyright
- Compliance badge
- Social links
```

## Page Templates

### Landing Page Structure
```
1. Hero Section
   - Brand mark
   - Headline (5xl-7xl)
   - Subheadline (xl-2xl)
   - Visual accent (flag bars, data viz)
   - Background: gradient-to-b from-gray-50

2. Division Showcase
   - Section headline
   - 3-column grid
   - Division cards
   - Background: white

3. Approach/Features
   - 2-column layout
   - Text + visual element
   - Background: gray-50

4. CTA Section
   - Centered content
   - Primary action button
   - Background: white

5. Footer
   - Comprehensive links
   - Background: gray-900
```

### Division Landing Structure
```
1. Hero with Breadcrumb
   - Link back to parent
   - Division badge
   - 2-column: text + stats
   - Border accent (division color)

2. Capabilities Grid
   - 3-column feature boxes
   - Detailed feature lists

3. Methodology
   - 2-column: process + compliance
   - Numbered steps
   - Checkmark items

4. CTA Grid
   - 3-column tool cards
   - Direct access to features

5. Footer
```

## Responsive Breakpoints

### Tailwind Breakpoints
```
sm: 640px (tablet)
md: 768px (small desktop)
lg: 1024px (desktop)
xl: 1280px (large desktop)
```

### Responsive Patterns
```
Mobile (< 640px):
- Single column layouts
- Stacked navigation
- Full-width cards
- Larger touch targets (44px min)

Tablet (640px - 1024px):
- 2-column grids
- Condensed navigation
- Balanced layouts

Desktop (> 1024px):
- 3-4 column grids
- Full navigation
- Optimal line lengths
```

## Animation & Interaction

### Transitions
```css
Standard: transition-colors
Duration: Default (150ms)
Hover: Subtle color changes, no dramatic effects
```

### Hover States
```
Links: Color change, underline
Buttons: Background darken
Cards: Border color change, subtle shadow
```

### No Animations
- Avoid: Fade-ins, slide-ins, complex animations
- Keep: Simple, functional transitions
- Respect: prefers-reduced-motion

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Primary text: Gray 900 on white (21:1)
- Secondary text: Gray 600 on white (7:1)

### Focus States
```css
*:focus-visible {
  outline: 2px solid #1a1a1a;
  outline-offset: 2px;
}
```

### Touch Targets
- Minimum: 44px × 44px (mobile)
- Spacing: Adequate gaps between interactive elements

## Anti-Patterns (What to Avoid)

### ❌ Don't Use
- Purple gradients (vibecoded aesthetic)
- Generic icon grids (🎯 📊 🚀 pattern)
- Rounded corners everywhere
- Drop shadows on everything
- Colorful gradients
- Trendy AI template designs
- Emoji-heavy interfaces
- Glassmorphism effects
- Neumorphism
- Excessive animations

### ✅ Do Use
- Clean borders and structure
- Kenya flag colors strategically
- Data visualization elements
- Professional typography
- Generous whitespace
- Clear hierarchy
- Functional design
- Custom, unique layouts

## Brand Voice

### Visual Tone
- **Professional:** Not playful or casual
- **Data-Driven:** Analytical, precise
- **Kenyan:** Local context, flag colors
- **Trustworthy:** Clean, transparent design
- **Authoritative:** Bold typography, clear structure

### Content Tone
- **Clear:** No jargon unless necessary
- **Confident:** Authoritative but not arrogant
- **Transparent:** Open about methods
- **Accessible:** Understandable to non-experts

---

**Design System Version:** 1.0
**Last Updated:** 2025-10-07
**Status:** Active

