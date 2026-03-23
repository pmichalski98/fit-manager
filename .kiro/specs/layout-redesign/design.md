# Layout Redesign: Sidebar-Only Navigation with Mobile Bottom Bar

## Overview

Remove the top header/navbar and consolidate all navigation into a fixed left sidebar on desktop and a native-style bottom tab bar on mobile. This eliminates wasted vertical space, simplifies the layout hierarchy, and gives mobile users a native app feel.

### Current State
- Top header (64px) contains: sidebar toggle, theme toggle, user dropdown
- Left sidebar contains: logo + 4 nav items (Dashboard, Training, Body, Photo)
- Mobile: sidebar opens as a sheet/drawer from the left via hamburger menu

### Target State
- No top header at all
- Desktop: fixed left sidebar with nav items at top, user/theme controls at bottom
- Mobile: bottom tab bar with nav items + user menu, no sidebar drawer

---

## Architecture

### Desktop Layout (≥768px)

```
┌──────────────┬──────────────────────────────────────┐
│              │                                      │
│  Logo        │          Page Content                │
│              │                                      │
│  ──────────  │                                      │
│  Dashboard   │                                      │
│  Training    │                                      │
│  Body        │                                      │
│  Photo       │                                      │
│              │                                      │
│              │                                      │
│              │                                      │
│              │                                      │
│  ──────────  │                                      │
│  🌙 Theme    │                                      │
│  👤 User     │                                      │
└──────────────┴──────────────────────────────────────┘
```

- Sidebar is always visible (no collapse toggle)
- Fixed position, full viewport height
- Width: 16rem (same as current)
- Nav items at top, utility controls (theme + user) at bottom with separator

### Mobile Layout (<768px)

```
┌──────────────────────────────────────┐
│                                      │
│          Page Content                │
│          (full width)                │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│  🏠   💪   ❤️   📷   👤             │
│  Home Train Body Photo  User        │
└──────────────────────────────────────┘
```

- No sidebar at all on mobile
- Bottom tab bar fixed to viewport bottom
- 5 tabs: 4 nav items + user menu (opens a sheet/popup with theme toggle + logout)
- Active tab highlighted with primary color
- Safe area padding for devices with home indicators (iOS)

---

## Components and Interfaces

### Files to Modify

| File | Action |
|------|--------|
| `src/components/layout-wrapper.tsx` | Remove `AppHeader`, add `MobileBottomNav`, conditionally render sidebar vs bottom nav |
| `src/components/app-sidebar.tsx` | Add `SidebarFooter` with theme toggle + user controls, remove mobile sheet handling |
| `src/components/app-header.tsx` | Delete entirely |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/mobile-bottom-nav.tsx` | Bottom tab bar for mobile with nav items + user action |

### Component Details

#### AppSidebar (modified)

```tsx
// Structure
<Sidebar>
  <SidebarHeader>        // Logo
  <SidebarContent>       // Nav items (Dashboard, Training, Body, Photo)
  <SidebarFooter>        // Theme toggle + User dropdown
</Sidebar>
```

- Add `SidebarFooter` section with a separator
- Theme toggle: simple icon button (Moon/Sun) inline
- User section: avatar + name, clicking opens dropdown with logout option
- Remove `isMobile`/`openMobile` handling (no mobile sidebar anymore)
- Sidebar is always expanded on desktop (remove collapsible behavior)

#### MobileBottomNav (new)

```tsx
// Structure
<nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
  <div className="flex items-center justify-around h-16 bg-background border-t pb-safe">
    {navItems.map(item => (
      <Link key={item.href} href={item.href}>
        <item.icon />
        <span>{item.label}</span>
      </Link>
    ))}
    <UserMenuTrigger />  // Opens sheet with theme + logout
  </div>
</nav>
```

- Fixed to bottom, full width
- Only renders below 768px (`md:hidden`)
- 5 equally-spaced tabs with icon + label
- Active state: primary color icon + label, subtle background
- User tab opens a bottom sheet (not dropdown) with:
  - User info (name, email, avatar)
  - Theme toggle
  - Logout button
- Bottom safe area padding via `pb-[env(safe-area-inset-bottom)]`

#### LayoutWrapper (modified)

```tsx
// Desktop: sidebar + content
// Mobile: content + bottom nav (no sidebar)

<SidebarProvider>
  {/* Sidebar only on desktop */}
  <div className="hidden md:block">
    <AppSidebar />
  </div>

  <main className="flex-1 max-h-svh overflow-y-auto">
    <div className="flex flex-1 flex-col p-4 md:p-6 pb-20 md:pb-6">
      {children}
    </div>
  </main>

  {/* Bottom nav only on mobile */}
  <MobileBottomNav />
</SidebarProvider>
```

- No `AppHeader` import or render
- Content gets extra bottom padding on mobile (`pb-20`) to account for bottom nav
- Sidebar hidden on mobile via CSS, not conditional rendering (SSR-friendly)

---

## Data Models

No data model changes required. This is a purely presentational refactor.

The nav items array will be extracted to a shared constant to avoid duplication between `AppSidebar` and `MobileBottomNav`:

```tsx
// src/lib/navigation.ts
export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboardIcon, href: "/dashboard" },
  { label: "Training", icon: DumbbellIcon, href: "/training" },
  { label: "Body", icon: HeartIcon, href: "/body" },
  { label: "Photo", icon: ImageIcon, href: "/photo" },
] as const;
```

---

## Error Handling

- Session loading state: skeleton/spinner for user section in both sidebar and bottom nav
- No session: hide user controls gracefully (already handled by `UserButton`)
- Navigation during loading: all nav links work independently of auth state (auth check is in the route layout)

---

## Testing Strategy

### Manual Testing Checklist

- [ ] Desktop (≥768px): sidebar is always visible, no toggle button
- [ ] Desktop: theme toggle works in sidebar footer
- [ ] Desktop: user dropdown works in sidebar footer (shows name, email, logout)
- [ ] Desktop: all nav links work and show active state
- [ ] Mobile (<768px): no sidebar visible
- [ ] Mobile: bottom tab bar is visible and fixed to bottom
- [ ] Mobile: all 4 nav tabs work with active state indication
- [ ] Mobile: user tab opens sheet with theme toggle + logout
- [ ] Mobile: safe area inset works on iOS (no content behind home indicator)
- [ ] Mobile: page content scrolls properly with bottom bar present
- [ ] Resize browser: smooth transition between mobile/desktop layouts
- [ ] Auth routes (/sign-in, /sign-up): neither sidebar nor bottom nav shown
- [ ] Theme toggle works correctly in both layouts
- [ ] Logout works from both sidebar dropdown and mobile sheet

### Device Testing

- Desktop Chrome/Firefox/Safari
- iPhone Safari (safe area insets)
- Android Chrome
- iPad (should use desktop layout at 768px+)

---

## Implementation Plan

### Task 1: Extract shared nav items
Create `src/lib/navigation.ts` with the shared `NAV_ITEMS` constant.

### Task 2: Redesign AppSidebar
- Add `SidebarFooter` with theme toggle and user controls
- Remove mobile-specific code (`openMobile`, `setOpenMobile`)
- Keep sidebar always expanded (remove collapsible toggle references)

### Task 3: Create MobileBottomNav
- Build the bottom tab bar component with 5 tabs
- Include user sheet with theme toggle and logout
- Handle safe area insets and active states

### Task 4: Update LayoutWrapper
- Remove `AppHeader` usage
- Hide sidebar on mobile, show bottom nav on mobile
- Add bottom padding for mobile content area

### Task 5: Delete AppHeader
- Remove `src/components/app-header.tsx`
- Clean up any remaining imports

### Task 6: Clean up sidebar.tsx (optional)
- Remove or simplify the mobile sheet handling in the base sidebar UI component if no longer needed
- Remove `SidebarTrigger` if unused elsewhere
