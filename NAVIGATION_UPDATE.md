# Navigation System Update - Google-Inspired Design

## Overview
The navigation has been restructured to follow a Google-inspired design pattern with clear division hierarchy and contextual subdivision navigation.

## New Navigation Structure

### Main Navigation Bar (Always Visible)

```
┌─────────────────────────────────────────────────────────────────┐
│ 🇰🇪 Blockcert Afrika  [Political] [Budget] [Health] │ About API│
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
1. **Logo** - Kenya flag bars + "Blockcert Afrika" wordmark
2. **Three Main Divisions** - Pill-style buttons with border
3. **Divider** - Vertical line separator
4. **Utility Links** - About, API

### Division Buttons

#### Active Division (Political)
- **Style:** Solid background with division color
- **Color:** Red (#BB0000) background, white text
- **State:** Clickable, goes to division landing page

#### Coming Soon Divisions (Budget, Health)
- **Style:** Border only, grayed out
- **Badge:** "SOON" label in top-right corner
- **State:** Not clickable, cursor-not-allowed

### Subdivision Bar (Contextual - Only in Political Section)

When user is in any political tool (/political, /forecasts, /explorer, etc.):

```
┌─────────────────────────────────────────────────────────────────┐
│ Overview  Forecasts  Explorer  Voter Data  Admin               │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Background:** Light gray (bg-gray-50)
- **Active State:** Red underline border (border-[#BB0000])
- **Horizontal Scroll:** On mobile, scrollable with hidden scrollbar
- **Sticky:** Stays below main nav when scrolling

## Visual Design

### Desktop Navigation

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  🇰🇪 Blockcert Afrika                                                │
│                                                                      │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│     │POLITICAL │  │  Budget  │  │  Health  │  │  About   API ↗     │
│     │  (red)   │  │  [SOON]  │  │  [SOON]  │                       │
│     └──────────┘  └──────────┘  └──────────┘                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
│                                                                      │
│  Overview  Forecasts  Explorer  Voter Data  Admin                   │
│  ─────────                                                           │
│  (red underline on active)                                           │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile Navigation

**Hamburger Menu:**
```
┌─────────────────────────┐
│ Divisions               │
│ ─────────────────────   │
│ ▶ Political             │
│   Budget [SOON]         │
│   Health [SOON]         │
│                         │
│ Political Tools         │
│ ─────────────────────   │
│   Overview              │
│   Forecasts             │
│   Explorer              │
│   Voter Data            │
│   Admin                 │
│                         │
│ ─────────────────────   │
│   About                 │
│   API Docs ↗            │
└─────────────────────────┘
```

## Color Coding

### Division Colors
- **Political:** Red (#BB0000)
- **Budget:** Green (#006600)
- **Health:** Black (#000000)

### States
- **Active Division:** Solid background with division color
- **Inactive Division:** Border only, gray text
- **Coming Soon:** Gray text + "SOON" badge
- **Active Subdivision:** Red underline border
- **Hover:** Background color transition

## User Flow

### Scenario 1: User on Home Page
1. Sees three division buttons in main nav
2. Political is highlighted (red background)
3. Budget and Health show "SOON" badges
4. No subdivision bar visible
5. Can click "Political" to go to division landing

### Scenario 2: User Clicks Political Division
1. Navigates to `/political`
2. Main nav: Political button stays highlighted
3. Subdivision bar appears below main nav
4. "Overview" is underlined (active)
5. Can navigate to Forecasts, Explorer, etc.

### Scenario 3: User on Forecasts Page
1. Main nav: Political button highlighted
2. Subdivision bar visible
3. "Forecasts" is underlined (active)
4. Can switch to other political tools via subdivision bar
5. Can return to Political overview or go to other divisions

### Scenario 4: User Leaves Political Section
1. Clicks "About" or goes to home
2. Subdivision bar disappears
3. Political button no longer highlighted
4. Clean main nav only

## Google-Inspired Elements

### What We Borrowed from Google's Design

1. **Pill-Style Division Buttons**
   - Similar to Google's product switcher
   - Clear, clickable buttons with borders
   - Active state with solid background

2. **Contextual Secondary Navigation**
   - Like Google's app-specific tabs (Gmail, Drive, etc.)
   - Only appears when relevant
   - Horizontal scrollable on mobile

3. **Minimal, Clean Design**
   - No dropdowns in main nav
   - Flat hierarchy
   - Clear visual states

4. **Underline Active Indicator**
   - Google's tab pattern
   - Colored underline for active item
   - Smooth transitions

## Technical Implementation

### Key Components

#### Main Navigation
```tsx
// Three division buttons
divisions.map((division) => (
  division.comingSoon ? (
    // Disabled state with badge
  ) : (
    // Active/clickable state
  )
))
```

#### Subdivision Bar
```tsx
// Only renders when isPoliticalSection === true
{isPoliticalSection && (
  <div className="bg-gray-50 border-b">
    // Horizontal scrollable tabs
  </div>
)}
```

### Responsive Behavior

**Desktop (> 768px):**
- All divisions visible in main nav
- Subdivision bar full width
- No scrolling needed

**Mobile (< 768px):**
- Hamburger menu
- Divisions in dropdown
- Subdivision bar scrollable
- Hidden scrollbar for clean look

## Benefits of This Approach

### 1. Clear Hierarchy
- **Level 1:** Three main divisions (Political, Budget, Health)
- **Level 2:** Division-specific tools (only when in that division)
- **Level 3:** Individual pages/features

### 2. Scalability
- Easy to add new divisions (just add to array)
- Each division can have its own subdivision bar
- Consistent pattern across all divisions

### 3. User Experience
- No nested dropdowns
- Clear visual feedback
- Contextual navigation (only show what's relevant)
- Mobile-friendly

### 4. Visual Clarity
- Color-coded divisions
- Clear active states
- "Coming Soon" badges prevent confusion
- Google-familiar pattern

## Future Enhancements

### When Budget Division Launches
1. Change `comingSoon: false` in divisions array
2. Create `/budget` landing page
3. Add budget subdivision items
4. Update subdivision bar logic to show budget tools when active

### When Health Division Launches
1. Same process as Budget
2. Use black (#000000) as accent color
3. Create health-specific subdivision items

### Potential Additions
- Search bar in main nav (Google-style)
- User account menu (right side)
- Notifications indicator
- Quick actions menu

## Comparison: Before vs After

### Before (Dropdown-Based)
```
Home | Forecasts | Explorer | Voter Data | Admin | About | API
                    ↓
            (Divisions dropdown)
```
**Issues:**
- Unclear hierarchy
- All tools at same level
- No division context
- Dropdown required

### After (Google-Inspired)
```
🇰🇪 Blockcert Afrika  [Political] [Budget] [Health] | About API
─────────────────────────────────────────────────────────────
Overview | Forecasts | Explorer | Voter Data | Admin
```
**Benefits:**
- Clear three-division structure
- Contextual subdivision navigation
- No dropdowns needed
- Visual hierarchy

## Testing Checklist

### Desktop
- [ ] Three division buttons visible
- [ ] Political button highlighted when in political section
- [ ] Budget and Health show "SOON" badges
- [ ] Subdivision bar appears only in political section
- [ ] Active subdivision has red underline
- [ ] Hover states work on all buttons
- [ ] Logo animation on hover

### Mobile
- [ ] Hamburger menu opens/closes
- [ ] Divisions section shows all three
- [ ] Political Tools section appears when in political section
- [ ] Subdivision bar scrolls horizontally
- [ ] No horizontal page scroll
- [ ] Touch targets adequate (44px)

### Navigation Flow
- [ ] Clicking Political goes to /political
- [ ] Clicking Forecasts shows subdivision bar
- [ ] Clicking About hides subdivision bar
- [ ] Clicking logo goes to home
- [ ] API link opens in new tab

### Visual States
- [ ] Active division has solid background
- [ ] Inactive divisions have border only
- [ ] Coming soon divisions are grayed out
- [ ] Active subdivision has underline
- [ ] Hover effects smooth

---

**Navigation Version:** 2.0 (Google-Inspired)
**Last Updated:** 2025-10-07
**Status:** Implemented

