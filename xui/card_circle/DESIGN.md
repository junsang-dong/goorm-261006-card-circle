---
name: Card Circle
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.02em
  currency-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '800'
    lineHeight: 26px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-desktop: 1.25rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-trust, gallery-grade marketplace aesthetic tailored for sports and collectible card trading. It targets passionate hobbyists, serious card collectors, and peer-to-peer traders who demand authentication precision, pristine item presentation, and operational transparency. 

The visual identity relies on **Modern Utility Minimalism** fused with tactile authenticity. It minimizes ornamental distraction so high-resolution card photography, authentication holograms, and grading labels remain the hero elements. Interfaces project security, clarity, and precision through structured metadata architecture, razor-sharp typographic hierarchy, and deliberate micro-interactions that mirror physical collector vaulting.

## Colors

The palette balances clinical authentication with energetic marketplace momentum:

- **Primary Accent (`#2563EB`)**: Collector Royal Blue. Conveys institutional trust, active marketplace operations, primary CTAs, and selected states.
- **Secondary Accent (`#10B981`)**: Mint Emerald. Applied exclusively to verified transactions, PSA/BGS authentications, successful escrow transitions, and deal completion markers.
- **Tertiary Accent (`#F59E0B`)**: Warm Amber. Reserved for transaction alerts, hold reservations (예약중), negotiation deadlines, and urgent trading counter-proposals.
- **Neutral Core (`#0F172A`)**: Deep Navy Slate. Serves as high-contrast primary typography and structural chrome, avoiding dead blacks in favor of premium editorial depth.
- **Background & Containers**: Pure Crisp White (`#FFFFFF`) for card display surfaces, layered over Neutral Light Grey (`#F8FAFC`) canvas backgrounds and subtle slate divider lines (`#E2E8F0`).

## Typography

The type system uses **Plus Jakarta Sans** paired with system-standard Korean fallback stacks (`Pretendard`, `Apple SD Gothic Neo`, `Noto Sans KR`). Plus Jakarta Sans provides clean geometry for English alphanumeric data (card numbers, PSA grades, player names, KRW values) while rendering Korean glyphs with balanced proportions.

- **Currency (`currency-display`)**: Korean Won values must be displayed with tabular numerals, strict thousands separators, and uniform trailing currency symbols (`580,000원`).
- **Grading & Badges (`label-sm`)**: Uppercase micro-type with tightened vertical metrics designed for compact container chips (e.g., `PSA 10 GEM MT`, `BGS 9.5`).
- **Body & Captions**: Optimized line heights prevent vertical clipping of Korean vowel markers and hangul double batchim.

## Layout & Spacing

The layout model prioritizes mobile-first usability through a constrained responsive container:

- **Mobile Viewport (< 640px)**: 2-column card grid with `0.75rem` (`gutter`) spacing and `1rem` (`margin`) outer canvas margins. Card feeds utilize consistent 4:5 aspect ratio media boxes to standardize physical card representation.
- **Tablet / Responsive Container (640px - 1024px)**: 3-column feed with `1rem` gutters.
- **Desktop / Web Preview (> 1024px)**: Centered phone-frame canvas (maximum 480px width for standard mobile view) or an expanded 4-column catalog mode with `1.25rem` gutters and `2rem` outer padding.
- **Bottom Navigation Safe Zone**: The mobile interface reserves a mandatory `5rem` bottom clearance to accommodate the floating persistent tab bar and floating action buttons (FABs).

## Elevation & Depth

Visual hierarchy leverages crisp surface layering combined with low-contrast ambient shadows to mimic clean acrylic collector display cases:

- **Level 0 (Base Canvas)**: `#F8FAFC`. The foundational canvas behind feed items and structured settings lists.
- **Level 1 (Card Slabs & Feed Containers)**: `#FFFFFF` with a single-pixel hairline border (`1px solid #E2E8F0`) and an ambient drop shadow: `0px 2px 8px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Pinned Modals, Trade Sheets & Drawers)**: `#FFFFFF` resting at `0px 12px 24px rgba(15, 23, 42, 0.08)` with backdrop blur (`backdrop-filter: blur(8px)` over `rgba(15, 23, 42, 0.35)`).
- **Level 3 (Floating Interactive Tabs & CTAs)**: `#FFFFFF` floating at `0px 4px 16px rgba(15, 23, 42, 0.12)`, anchored above page content.
- **Hologram Shimmer Highlight**: Used selectively on authenticated PSA/BGS detail pages via an angled micro-gradient border (`linear-gradient(135deg, rgba(37,99,235,0.15), rgba(16,185,129,0.15))`).

## Shapes

The design system employs **Roundedness Level 2 (0.5rem base)**, echoing the rounded corner radius of standard physical sports trading cards and acrylic magnetic slabs (원터치 자석 홀더).

- **Standard Cards & Image Frames**: `0.75rem` to `1rem` radius (`rounded-lg`), mirroring sleeve silhouettes.
- **Metadata Badges & Grading Chips**: Fully rounded pill shapes (`9999px`) to distinguish categorical tags from interactive square buttons.
- **Input Fields & Search Bars**: `0.5rem` (`rounded`) for input targets, ensuring structural stability across compact screens.
- **Bottom Tab Navigation Bar**: `1.25rem` (`rounded-xl`) outer corners for floating island style, or crisp edge-to-edge flush boundary.

## Components

### Buttons
- **Primary Action (교환 제안하기 / 바로 구매)**: Background `#2563EB`, text `#FFFFFF`, height `48px`, font `label-lg`, radius `0.5rem`. Active state: scale down to 0.98.
- **Secondary Action (채팅하기)**: Background `#EFF6FF`, text `#2563EB`, border `1px solid #BFDBFE`.
- **Tertiary / Utility**: Ghost background with slate outline (`#E2E8F0`), text `#0F172A`.

### Chips & Metadata Badges
- **Grading Badges**: Distinct high-contrast pill format. PSA uses `#DC2626` (Red border/fill tint), BGS uses `#B45309` (Gold tint), Uncertified/Raw uses `#64748B`.
- **Condition Tags**: Soft badges (`#F1F5F9`, text `#334155`) displaying standardized criteria: `새것에 가까움 (Near Mint)`, `양호 (Lightly Played)`, `사용감 있음 (Played)`.
- **Category Chips (Sports)**: Top-level filter pills (`야구`, `농구`, `축구`, `기타`). Selected state features solid `#0F172A` background with `#FFFFFF` text.

### Card Feed Item (Trade Tile)
- 4:5 image container with smooth top-radius, image fit set to contain/cover with subtle grey backdrop (`#F1F5F9`).
- Status overlays: Pinned badges on top-left for availability (`판매중`, `예약중` in warm amber, `거래완료` in soft muted gray).
- Bottom metadata stack: Player name / card title (1 line truncate), category chip, grade badge, and formatted KRW price highlighted in bold display font.

### Form Inputs & Search
- Sticky top search bar with integrated filter trigger. Height `44px`, background `#FFFFFF`, border `#E2E8F0`, interior placeholder `#94A3B8`. Left-aligned loupe icon, right-aligned filter button.

### Bottom Navigation Tab Bar
- 5-destination navigation bar: `홈 (Home)`, `탐색 (Discover)`, `등록 (List Card - elevated center blue FAB)`, `채팅 (Chat)`, `마이 (Vault/Profile)`.
- Fixed height `56px` plus device safe-area inset, top divider `1px solid #F1F5F9`, active icon and text colored in primary `#2563EB`.