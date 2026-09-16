# Deluxe Veneers ERP Component Library

This document is the official reusable UI library guide for the Deluxe Veneers ERP. It defines the visual language, design tokens, component rules, and interaction patterns that should be used consistently across Inventory, Purchase, Production, Quality, Warehouse, Packing, Dispatch, Administration, and future ERP modules.

The Component Library is finalized and should now be treated as the official reusable Design System for the ERP application. All future ERP modules must reuse this library rather than recreating UI patterns locally.

The system is intentionally enterprise-focused:

- light, readable, long-session friendly
- minimal and professional
- token-driven
- reusable and scalable
- built around consistent states and layout rules

> Important: Never hardcode colors, spacing, radius, or interaction styles. Always use the published token system and extend existing namespaces rather than creating one-off values.

---

# Table of Contents

- [1. Design Principles](#1-design-principles)
- [2. Brand Identity](#2-brand-identity)
- [3. Color Tokens](#3-color-tokens)
  - [Brand Colors](#brand-colors)
  - [Primary Scale](#primary-scale)
  - [Neutral Scale](#neutral-scale)
  - [Success Scale](#success-scale)
  - [Warning Scale](#warning-scale)
  - [Error Scale](#error-scale)
  - [Info Scale](#info-scale)
- [4. Typography](#4-typography)
- [5. Spacing](#5-spacing)
- [6. Border Radius](#6-border-radius)
- [7. Elevation](#7-elevation)
- [8. Icons](#8-icons)
- [9. Input Components](#9-input-components)
  - [Text Input](#text-input)
  - [Text Area](#text-area)
  - [Dropdown](#dropdown)
  - [Date Picker](#date-picker)
  - [Date Range Picker](#date-range-picker)
  - [Toggle Switch](#toggle-switch)
  - [Checkbox](#checkbox)
- [10. Forms](#10-forms)
- [11. Formatting Standards](#11-formatting-standards)
- [12. Data Display](#12-data-display)
- [13. Navigation](#13-navigation)
- [14. Application Layout Standards](#14-application-layout-standards)
- [15. Standard CRUD Pattern](#15-standard-crud-pattern)
- [16. Component Tokens](#16-component-tokens)
- [17. Best Practices](#17-best-practices)
- [18. Do's and Don'ts](#18-dos-and-donts)
- [19. Future Components](#19-future-components)
- [20. ERP Application Architecture](#20-erp-application-architecture)
- [21. Final Folder Structure](#21-final-folder-structure)
- [22. Feature Folder Structure](#22-feature-folder-structure)
- [23. Naming Standards](#23-naming-standards)
- [24. Sidebar Modules and Structure](#24-sidebar-modules-and-structure)
- [25. Coding Standards](#25-coding-standards)
- [26. Development Rules](#26-development-rules)
- [27. Implementation Objective](#27-implementation-objective)

---

# 1. Design Principles

The Deluxe Veneers ERP design system follows a strict enterprise documentation and delivery model.

## Core Principles

- Enterprise UI: Optimized for operational workflows, dense datasets, and long working hours.
- Minimal: Avoid decorative UI, novelty motion, glassmorphism, and unnecessary visual noise.
- Professional: Prioritize clarity, hierarchy, alignment, and consistency over visual flourish.
- Reusable: Every pattern should be reusable across ERP modules without redesign.
- Consistent: Similar actions, states, and layouts must look and behave the same everywhere.
- Token driven: Foundation values come from theme tokens, not ad hoc values.
- Component based: Build repeatable UI from shared primitives and standardized component states.

## Interface Character

- White and warm-neutral surfaces
- Maroon brand accents used selectively
- Thin borders instead of heavy shadows
- Rounded corners with restrained radius
- Strong typography hierarchy
- Compact but comfortable enterprise density

## What To Avoid

- Hardcoded colors
- Cool, generic SaaS blues unless part of semantic info states
- Large decorative shadows
- Gradient-heavy marketing styles
- Inconsistent icon sets
- Native browser dropdowns for ERP selects

---

# 2. Brand Identity

The Deluxe Veneers ERP should reflect the Deluxe Veneers brand with controlled maroon accents placed on a predominantly neutral interface.

## Official Brand Colors

| Brand Color | Hex | Use | Avoid |
|---|---|---|---|
| Primary Maroon | `#741616` | active navigation, selected tabs, primary actions, focus indicators, active icons | large page backgrounds or dense text blocks |
| Secondary Maroon | `#A83F3F` | hover emphasis, secondary brand accents, active hover states | primary page framing |
| White | `#FFFFFF` | surfaces, cards, table cells, form controls | standalone contrast accents without border definition |
| Black | `#000000` | brand reference only, high-contrast assets | default body text in the ERP |

## Brand Usage Rules

- Use primary maroon for the most important active state.
- Use secondary maroon for hover, transition, and support accents.
- Keep the interface predominantly white and warm neutral.
- Use brand color as emphasis, not as a full-page background.
- Keep high-frequency data surfaces neutral so content stays readable.

> Supporting reference tone: `#FCF0C5` appears in the color documentation as a warm cream reference color, but it is not one of the four primary brand colors.

---

# 3. Color Tokens

The ERP color system uses a small brand layer, a warm neutral base, and semantic scales for feedback states.

## Color Token Rules

- Always use token references.
- Never hardcode hex values in product UI.
- Use scale shades according to state and contrast needs.
- Keep backgrounds light and text dark.
- Use semantic scales for meaning, not for decoration.

## Published Foundation Namespaces

```text
theme.customTokens.brand.*
theme.customTokens.neutrals.*
theme.customTokens.semanticScale.*
theme.customTokens.surfaces.*
theme.customTokens.text.*
theme.customTokens.borders.*
theme.palette.*
```

## Brand Colors

| Token | Value | Purpose |
|---|---|---|
| `theme.customTokens.brand.primary` | `#741616` | primary brand accent |
| `theme.customTokens.brand.secondary` | `#A83F3F` | hover and supporting accent |
| `theme.palette.common.white` | `#FFFFFF` | surface color |
| `theme.palette.common.black` | `#000000` | brand reference only |

## Primary Scale

**Purpose**

- Active brand accents
- Selected states
- Focus emphasis
- Strong call-to-action surfaces

**Example usage**

- Active sidebar item
- Current tab indicator
- Primary action button
- Maroon table header

**State guidance**

| Role | Recommended Shades | Notes |
|---|---|---|
| Background | `50`, `100` | subtle brand-tinted surfaces |
| Border | `300`, `400`, `500` | supportive brand emphasis |
| Hover | `500`, `600` | interactive emphasis |
| Active | `700`, `800` | strongest brand state |
| Disabled | do not use directly | use neutral disabled tokens instead |
| Text | `700`, `800`, `900` | on light backgrounds only |

| Shade | Hex |
|---|---|
| 50 | `#FCF7F7` |
| 100 | `#F8ECEC` |
| 200 | `#EBCFCF` |
| 300 | `#DEAEAE` |
| 400 | `#CC8686` |
| 500 | `#B86060` |
| 600 | `#A83F3F` |
| 700 | `#741616` |
| 800 | `#5D1010` |
| 900 | `#420808` |

## Neutral Scale

**Purpose**

- Default text and border system
- Surface hierarchy
- Disabled states
- Dividers and inactive interface elements

**Example usage**

- Page backgrounds
- Cards and table rows
- Field borders
- Caption text

**State guidance**

| Role | Recommended Shades | Notes |
|---|---|---|
| Background | `50`, `100` | page and alt surfaces |
| Border | `200`, `300` | standard and hover borders |
| Hover | `100`, `200` | subtle neutral hover surfaces |
| Active | pair with brand tokens | neutral alone should not carry important active state |
| Disabled | `400`, `500` | disabled text and subtle controls |
| Text | `700`, `800`, `900` | standard readable text |

| Shade | Hex |
|---|---|
| 50 | `#FCFAFA` |
| 100 | `#F5F1F1` |
| 200 | `#E5DDDD` |
| 300 | `#D2C7C7` |
| 400 | `#B5A6A6` |
| 500 | `#968686` |
| 600 | `#776A6A` |
| 700 | `#5B5555` |
| 800 | `#403B3B` |
| 900 | `#1F1F1F` |

## Success Scale

**Purpose**

- Positive validation
- Completed workflow steps
- Approved status communication

**Example usage**

- Success badges
- Inline validation success
- Completed stepper stages

**State guidance**

| Role | Recommended Shades | Notes |
|---|---|---|
| Background | `50`, `100` | gentle success surface |
| Border | `200`, `300`, `400` | success outline treatment |
| Hover | `400`, `500` | interactive success states |
| Active | `600`, `700` | committed positive action |
| Disabled | do not use directly | use neutral disabled layer |
| Text | `700`, `800`, `900` | readable success text on light backgrounds |

| Shade | Hex |
|---|---|
| 50 | `#F3FBF4` |
| 100 | `#DDF3E0` |
| 200 | `#BFE6C5` |
| 300 | `#97D49C` |
| 400 | `#6FC276` |
| 500 | `#43A047` |
| 600 | `#388E3C` |
| 700 | `#2E7D32` |
| 800 | `#256628` |
| 900 | `#1B4D1F` |

## Warning Scale

**Purpose**

- Caution
- Pending review
- Non-blocking alerts

**Example usage**

- Warning banners
- Partial validation warnings
- Pending approval cues

**State guidance**

| Role | Recommended Shades | Notes |
|---|---|---|
| Background | `50`, `100` | soft warning surface |
| Border | `200`, `300`, `400` | caution framing |
| Hover | `400`, `500` | warning interaction states |
| Active | `600`, `700` | strong warning emphasis |
| Disabled | do not use directly | use neutral disabled layer |
| Text | `700`, `800`, `900` | readable warning text |

| Shade | Hex |
|---|---|
| 50 | `#FFF9EB` |
| 100 | `#FFF0C7` |
| 200 | `#FFE08F` |
| 300 | `#FFD05A` |
| 400 | `#F4B942` |
| 500 | `#D89A1E` |
| 600 | `#C6861A` |
| 700 | `#AA6E12` |
| 800 | `#8C5B0E` |
| 900 | `#6F470A` |

## Error Scale

**Purpose**

- Validation failure
- Destructive actions
- Rejected process states

**Example usage**

- Error helper text
- Invalid fields
- Destructive confirmations

**State guidance**

| Role | Recommended Shades | Notes |
|---|---|---|
| Background | `50`, `100` | soft error surfaces |
| Border | `200`, `300`, `400` | invalid field outline |
| Hover | `400`, `500` | stronger interactive warning |
| Active | `600`, `700` | destructive emphasis |
| Disabled | do not use directly | use neutral disabled layer |
| Text | `700`, `800`, `900` | readable error text |

| Shade | Hex |
|---|---|
| 50 | `#FDF2F2` |
| 100 | `#FADDDD` |
| 200 | `#F2BABA` |
| 300 | `#E98D8D` |
| 400 | `#DB6464` |
| 500 | `#C94A4A` |
| 600 | `#B34747` |
| 700 | `#963939` |
| 800 | `#742A2A` |
| 900 | `#531C1C` |

## Info Scale

**Purpose**

- Informational messaging
- Neutral process guidance
- Secondary status communication

**Example usage**

- Informational banners
- Guidance chips
- Non-critical contextual feedback

**State guidance**

| Role | Recommended Shades | Notes |
|---|---|---|
| Background | `50`, `100` | soft info surfaces |
| Border | `200`, `300`, `400` | calm information framing |
| Hover | `400`, `500` | interactive info accents |
| Active | `600`, `700` | strong informational state |
| Disabled | do not use directly | use neutral disabled layer |
| Text | `700`, `800`, `900` | readable informational text |

| Shade | Hex |
|---|---|
| 50 | `#F3F7FD` |
| 100 | `#DFEAF9` |
| 200 | `#BDD5F3` |
| 300 | `#94BDEB` |
| 400 | `#6D9FE0` |
| 500 | `#4D82D4` |
| 600 | `#3F6FA6` |
| 700 | `#355D8A` |
| 800 | `#294A6D` |
| 900 | `#1D3552` |

---

# 4. Typography

The typography system uses Inter and a compact enterprise hierarchy tuned for documentation, workflow screens, tables, and form-heavy pages.

| Style | Token | Font Size | Weight | Line Height | Purpose | Example Usage |
|---|---|---|---|---|---|---|
| Display | `theme.customTokens.typographyScale.display` | `2.5rem` | `700` | `1.15` | hero heading for primary documentation moments | system title in design system documentation |
| H1 | `theme.typography.h1` | `2rem` | `700` | `1.2` | page-level heading | major module heading |
| H2 | `theme.typography.h2` | `1.5rem` | `700` | `1.25` | section heading | page sections like Inputs, Forms, Data Display |
| H3 | `theme.typography.h3` | `1.25rem` | `600` | `1.3` | subsection heading | table groups, form groups |
| Title | `theme.typography.subtitle1` | `1rem` | `600` | `1.5` | reusable component title | card titles, component section titles |
| Subtitle | `theme.typography.body1` | `0.95rem` | `500` | `1.6` | supporting subheading pattern | page subtitle under H1 or H2 |
| Body | `theme.typography.body2` | `0.875rem` | `500` | `1.55` | standard supporting content | descriptions, notes, table metadata |
| Caption | `theme.typography.caption` | `0.75rem` | `500` | `1.45` | compact meta layer | helper text, token labels |
| Label | `theme.typography.subtitle2` | `0.8125rem` | `600` | `1.35` | field labels and dense navigation text | form labels, tabs, compact table labels |

## Typography Rules

- Use `Display` sparingly.
- Use `H1` only once per page.
- Use `H2` for major page sections.
- Use `H3` for component subsections.
- Keep labels short, direct, and operational.
- Keep helper and caption text concise.
- Do not simulate hierarchy by changing random font sizes.

---

# 5. Spacing

The system is built on an 8-point spacing unit with half-step support for tighter component layouts.

| Pixel Value | Token | Common Uses |
|---|---|---|
| `4px` | `theme.spacing(0.5)` | icon-label micro gaps, badge padding trims |
| `8px` | `theme.spacing(1)` | tight control spacing, label-to-field spacing |
| `12px` | `theme.spacing(1.5)` | compact component grouping, grid gaps inside cards |
| `16px` | `theme.spacing(2)` | standard interior spacing for compact surfaces |
| `20px` | `theme.spacing(2.5)` | default card content rhythm |
| `24px` | `theme.spacing(3)` | section padding, grouped content spacing |
| `32px` | `theme.spacing(4)` | larger block separation |
| `40px` | `theme.spacing(5)` | major section rhythm |
| `48px` | `theme.spacing(6)` | page section separation |
| `64px` | `theme.spacing(8)` | wide desktop spacing or special layout breathing room |

## Spacing Rules

- Use smaller tokens inside controls and compact docs.
- Use `20px` to `24px` as the default internal card rhythm.
- Use `40px` to `48px` between major sections.
- Prefer token increments over arbitrary custom spacing.

---

# 6. Border Radius

Rounded corners should feel soft and premium, but never playful.

| Radius | Token | Value | Typical Usage |
|---|---|---|---|
| Small | `theme.customTokens.radius.sm` | `10px` | tight swatches, mini chips, color blocks |
| Medium | `theme.customTokens.radius.md` | `12px` | standard controls, cards, buttons, tabs, tables |
| Large | `theme.customTokens.radius.lg` | `18px` | larger content containers, panels |
| Extra Large | `theme.customTokens.radius.xl` | `24px` | special large surfaces only |
| Pill | `theme.customTokens.radius.pill` | `999px` | token badges, indicators, chips, rounded tracks |

## Radius Rules

- `12px` is the default reusable component radius.
- Use `18px` and above only on larger framing surfaces.
- Keep pills for badges, switches, and indicators only.

---

# 7. Elevation

The Deluxe Veneers ERP avoids heavy shadows. Elevation exists, but should be used sparingly and with restraint.

| Elevation | Token | Intent | Usage |
|---|---|---|---|
| None | `theme.customTokens.elevation.none` | flat enterprise surface | default cards, tables, forms, layout panels |
| XS | `theme.customTokens.elevation.xs` | minimal lift | small popovers, subtle floating utilities |
| SM | `theme.customTokens.elevation.sm` | light separation | dropdown popups, compact overlays |
| MD | `theme.customTokens.elevation.md` | stronger overlay separation | modals or larger transient floating surfaces |
| LG | `theme.customTokens.elevation.lg` | highest supported shadow | rare top-layer surfaces only |

## Elevation Rules

- Prefer borders before shadows.
- Most ERP surfaces should remain at `None`.
- Use `XS` or `SM` for floating UI before considering `MD`.
- `LG` should be rare and intentional.

---

# 8. Icons

Icons in Deluxe Veneers ERP are functional, not decorative.

## Icon Philosophy

- Use one outlined icon system throughout the ERP.
- Keep icon size consistent.
- Use icons to support scanning, not replace labels.
- Use maroon for active or action emphasis.
- Avoid mixing icon styles.

## Action Icons

These icons are intended for buttons, icon buttons, table actions, toolbars, dialogs, and workflow controls.

| Name | Lucide Icon | Token | Typical Usage |
|---|---|---|---|
| Save | `Save` | `theme.icons.save` | save record |
| Submit | `SendHorizontal` | `theme.icons.submit` | submit workflow or form |
| Edit | `Pencil` | `theme.icons.edit` | edit row or record |
| Delete | `Trash2` | `theme.icons.delete` | delete action |
| Add | `Plus` | `theme.icons.add` | add row or record |
| Download | `Download` | `theme.icons.download` | download document or report |
| Export | `FileOutput` | `theme.icons.export` | export dataset |
| View | `Eye` | `theme.icons.view` | preview or inspect |
| Print | `Printer` | `theme.icons.print` | print document |
| Refresh | `RefreshCw` | `theme.icons.refresh` | refresh data |
| Search | `Search` | `theme.icons.search` | search field or search action |
| Filter | `Filter` | `theme.icons.filter` | filter menus and table filters |
| Upload | `Upload` | `theme.icons.upload` | upload file |
| Copy | `Copy` | `theme.icons.copy` | duplicate or copy values |
| Close | `X` | `theme.icons.close` | close dialog or clear |
| More | `MoreHorizontal` | `theme.icons.more` | overflow actions |

## Sidebar Icons

Only top-level sidebar modules use icons. Nested menu items use bullet points only.

| Module | Lucide Icon | Token |
|---|---|---|
| Dashboard | `LayoutDashboard` | `theme.icons.sidebar.dashboard` |
| User Management & Role Permission | `UsersRound` | `theme.icons.sidebar.users` |
| Masters | `Star` | `theme.icons.sidebar.masters` |
| Inventory | `Boxes` | `theme.icons.sidebar.inventory` |
| QC | `BadgeCheck` | `theme.icons.sidebar.qc` |
| Warehouse | `Warehouse` | `theme.icons.sidebar.warehouse` |
| Factory | `Factory` | `theme.icons.sidebar.factory` |
| Packing | `PackageOpen` | `theme.icons.sidebar.packing` |
| Dispatch | `Truck` | `theme.icons.sidebar.dispatch` |

## Sidebar Icon Rules

- Only primary modules receive icons.
- Child items must use bullet points only.
- Use `20px` as the default sidebar/action icon size.
- Keep all sidebar icons outlined and visually balanced.

---

# 9. Input Components

The input system is designed for dense, production-facing ERP forms. Labels remain visible above fields, states are explicit, and controls rely on a shared maroon-accented interaction language.

## Input Token Pattern

The current published naming convention is:

```text
theme.components.<component>.<state>
```

Examples:

- `theme.components.input.default`
- `theme.components.select.focused`
- `theme.components.dateRangePicker.selectedRange`

Future states should extend the same pattern instead of introducing reversed naming.

## Text Input

**Purpose**

- Supplier names
- Invoice references
- Lot and bundle references
- Short operational fields

**Documented variants**

| Variant | Published Token | Usage |
|---|---|---|
| Default | `theme.components.input.default` | empty field in resting state |
| Filled | `theme.components.input.filled` | populated field |
| Focused | `theme.components.input.focused` | active keyboard focus |
| Helper Text | `theme.components.input.helper` | contextual input guidance |
| Error | `theme.components.input.error` | validation failure |
| Disabled | `theme.components.input.disabled` | unavailable field |
| Read Only | `theme.components.input.readOnly` | visible but locked value |

**Design rules**

- Keep label above the field.
- Use placeholder as example content, never as the only label.
- Keep field height compact and enterprise-friendly.
- Use inline helper or error text directly under the field.

**Validation**

- Error state must be immediate and local to the field.
- Success styling may use semantic success colors, but a dedicated published text-input success token is not currently documented.

## Text Area

**Purpose**

- Remarks
- Production notes
- Quality comments
- Handover context

**Documented variants**

| Variant | Published Token | Usage |
|---|---|---|
| Default | `theme.components.textarea.default` | standard multiline note field |
| Helper | `theme.components.textarea.helper` | descriptive guidance |
| Error | `theme.components.textarea.error` | invalid or incomplete note |
| Disabled | `theme.components.textarea.disabled` | locked multiline field |
| Read Only | `theme.components.textarea.readOnly` | visible static remarks |

**Design rules**

- Keep text areas compact by default.
- Expand only when the task genuinely requires more room.
- Use helper text only when it prevents user ambiguity.

## Dropdown

**Purpose**

- Departments
- Supplier selection
- Workflow selection
- Currency
- Veneer type

**Documented variants**

| Variant | Published Token | Usage |
|---|---|---|
| Default | `theme.components.select.default` | resting empty select |
| Hover | `theme.components.select.hover` | pointer hover preview |
| Focused | `theme.components.select.focused` | active control |
| Selected | `theme.components.select.selected` | chosen value |
| Error | `theme.components.select.error` | validation failure |
| Disabled | `theme.components.select.disabled` | unavailable selection |

**Reserved extension**

- `theme.components.select.open` should be used if the popup-open field state is published separately in a future release.

**Design rules**

- Native browser dropdowns must never be used for ERP selects.
- Use custom themed popup surfaces with the Deluxe Veneers palette.
- Selected items should follow maroon active treatment.
- Keep the field neutral until meaningful interaction occurs.

## Date Picker

**Purpose**

- Inward dates
- Invoice dates
- Dispatch dates
- Workflow milestones

**Documented variants**

| Variant | Published Token | Usage |
|---|---|---|
| Default | `theme.components.datePicker.default` | empty date field |
| Selected Date | `theme.components.datePicker.selected` | chosen date |
| Error | `theme.components.datePicker.error` | required date missing or invalid |

**Reserved extension**

The current library establishes the visual language for additional states, but the following namespaces are not yet explicitly published in the current showcase:

- `theme.components.datePicker.focused`
- `theme.components.datePicker.open`
- `theme.components.datePicker.disabled`

**Design rules**

- Use a custom themed calendar popup.
- Keep calendar surfaces compact and neutral.
- Use maroon only for selected day emphasis, active controls, and focus.

## Date Range Picker

**Purpose**

- Report windows
- Dispatch planning ranges
- Production spans
- Audit periods

**Documented variants**

| Variant | Published Token | Usage |
|---|---|---|
| Default | `theme.components.dateRangePicker.default` | empty range |
| Selected Range | `theme.components.dateRangePicker.selectedRange` | defined period |
| Error | `theme.components.dateRangePicker.error` | invalid or missing range |

**Design rules**

- Use two coordinated date fields.
- Open individual calendars for start and end rather than a single oversized range calendar.
- Keep range controls aligned with normal field density.

## Toggle Switch

**Purpose**

- Immediate binary settings
- Optional background behaviors
- Automation toggles

**Documented variants**

| Variant | Published Token | Usage |
|---|---|---|
| Off | `theme.components.switch.off` | inactive setting |
| On | `theme.components.switch.on` | enabled setting |

**Reserved extension**

- `theme.components.switch.disabled` may be published later if disabled switch states require separate documentation.

**Design rules**

- Use only for immediate binary behavior.
- Do not use switches where confirmation or submission is required.
- Keep the track neutral when off and maroon when on.

## Checkbox

**Purpose**

- Confirmations
- Approval flags
- Optional workflow controls
- Multi-select supporting actions

**Documented variants**

| Variant | Published Token | Usage |
|---|---|---|
| Unchecked | `theme.components.checkbox.unchecked` | resting unchecked state |
| Checked | `theme.components.checkbox.checked` | confirmed state |
| Indeterminate | `theme.components.checkbox.indeterminate` | partial selection |
| Disabled | `theme.components.checkbox.disabled` | unavailable option |
| Disabled Checked | `theme.components.checkbox.disabledChecked` | locked selected state |

**Design rules**

- Use checkbox groups for non-exclusive choices.
- Keep labels clear and close to the control.
- Use indeterminate only when the parent-child relationship is meaningful.

---

# 10. Forms

Forms in Deluxe Veneers ERP are structured, grid-based, and optimized for high-volume operational data entry.

## Supported Layouts

| Layout | Token | Use Case |
|---|---|---|
| 3-column grid | `theme.forms.grid3` | general desktop forms and tablet-friendly ERP forms |
| 4-column grid | `theme.forms.grid4` | wider screens with moderate density |
| 5-column grid | `theme.forms.grid5` | dense workstation-oriented data entry |
| Dynamic form table | `theme.forms.dynamicTable` | inline line-item entry inside forms |

## Form Standards

| Element | Standard | Rule |
|---|---|---|
| Labels | always above the field | never rely on placeholder text as a label |
| Required fields | red asterisk | mark mandatory fields clearly before submit |
| Optional fields | no suffix | keep optional labels clean |
| Placeholder | example input only | never replace labels |
| Helper text | only where necessary | add only when it prevents ambiguity |
| Error messages | directly below the field | keep validation local to the control |
| Read Only | grey background | visible but not editable |
| Disabled | grey background with muted text | unavailable interaction state |
| Validation | immediate where possible | surface issues early without waiting for final submit |
| Primary action | `Submit` | centered below the form |
| Secondary action | `Cancel` | centered below the form |

Form spacing, alignment, label position, and button placement should remain consistent across every ERP module.

## Form Rules

- Labels should stay directly above their controls.
- Group fields by operational meaning.
- Keep related measurements together.
- Use the Remarks field across full row width where needed.
- Keep helper and validation messaging local to the field.

## Buttons

- Primary and secondary form actions should remain centered below the form grid.
- Use `Cancel` for secondary action.
- Use `Submit` for primary action.
- Keep button width stable so layouts do not shift.

## Validation

- Mark required fields clearly before submission.
- Show error messages inline.
- Use helper text only when it reduces ambiguity.
- Maintain separate treatments for read-only and disabled fields.

## Responsive Behavior

Forms should collapse by available space:

- 5 columns to 4 columns
- 4 columns to 3 columns
- 3 columns to 1 column

## Dynamic Form Table

The form table pattern supports:

- inline editing
- dynamic row addition
- row deletion
- horizontal scrolling
- sticky header
- dense line-item entry

Typical use cases:

- inward line items
- purchase rows
- production lines
- dispatch rows
- packing entries

---

# 11. Formatting Standards

Formatting standards ensure that values look identical across masters, transactions, tables, forms, reports, and approval screens.

| Data Type | Standard Format | Example |
|---|---|---|
| Date | `DD/MM/YYYY` | `27/06/2026` |
| Date & Time | `DD/MM/YYYY HH:mm` | `27/06/2026 14:30` |
| Currency | `Rs 10,000.00` | `Rs 10,000.00` |
| Decimal Numbers | 2 decimal places | `125.75` |
| Quantity | 3 decimal places | `18.250` |
| Percentage | 2 decimal places | `12.50%` |
| Weight | `kg` with 3 decimal places | `148.325 kg` |
| Length | `mm` | `2440 mm` |
| Width | `mm` | `1220 mm` |
| Thickness | `mm` | `0.600 mm` |

## Formatting Rules

- Dates must use the same display format across forms, tables, filters, and detail pages.
- Date and time values must include both date and 24-hour time where operational context requires it.
- Currency must remain consistent across all commercial workflows and should always include thousands separators and two decimal places.
- Decimal values should use two decimal places unless the business meaning requires a more precise convention.
- Quantity should default to three decimal places for inventory and production accuracy.
- Units and measurements must always be displayed with their unit when shown to users.
- Length, width, and thickness should remain standardized in millimeters unless the module explicitly defines a different measurement system.

Consistent formatting is mandatory across all ERP modules and should never vary by screen unless a business rule explicitly requires it.

---

# 12. Data Display

ERP data display is centered around reusable, high-density tables.

## Standard Table Variants

| Variant | Token | Purpose |
|---|---|---|
| Standard Table | `theme.components.table.standard` | master records, transactions, inward logs |
| Selectable Table | `theme.components.table.selectable` | approval queues, bulk review, multi-row workflows |

## Table Standards

| Standard | Value or Rule |
|---|---|
| Default Row Height | `44px` |
| Header Height | `48px` |
| Default Pagination | `25 rows` |
| Rows Per Page Options | `25`, `50`, `100` |
| Column Width | dynamic |
| Horizontal Scroll | enabled automatically |
| Sticky Header | required |
| Column Filters | available |
| Sorting | available |
| Pagination | required |
| Selection | optional depending on module |
| Overflow Actions | three-dot menu |

### Table Design Rules

- Tables should remain dense but readable.
- Column width should expand based on content.
- Horizontal scrollbar should remain hidden until scrolling is needed.
- Header should remain sticky.
- Long text should truncate with tooltip support.
- Row hover should remain subtle.
- Actions should remain in the last column.

## Required Table Capabilities

- Dynamic width columns
- Horizontal scrolling
- Subtle visible scrollbar
- Sticky header
- Sorting
- Header filter actions
- Pagination
- Frozen actions column
- Selectable rows in the selectable variant
- Responsive behavior for 10, 15, and 20+ column datasets

## Table Design Rules

- Keep table surfaces predominantly white.
- Use a maroon header for the main ERP table reference pattern.
- Keep borders thin and neutral.
- Use very subtle alternating row backgrounds.
- Highlight row hover gently.
- Use a 3-dot overflow control for row actions.

## Actions Column

The standard actions pattern is:

- Edit
- Delete
- Revert
- Issue for Next Process

Actions should remain behind a compact overflow menu rather than occupying multiple visible buttons in each row.

## Selection Rules

Selectable tables support:

- header checkbox
- row checkbox
- multi-select
- selected row styling
- selection count
- clear selection action

## Pagination Rules

Pagination should include:

- record count summary
- rows per page
- previous and next
- first and last
- page numbers
- go to page

## Published Table Tokens

Current published table tokens:

- `theme.components.table.standard`
- `theme.components.table.selectable`

Recommended extension pattern for future granular table tokens:

- `theme.components.table.header`
- `theme.components.table.row`
- `theme.components.table.cell`
- `theme.components.table.selection`
- `theme.components.table.pagination`
- `theme.components.table.actions`

These extension names should follow the existing table namespace if and when they are formalized.

---

# 13. Navigation

Navigation in Deluxe Veneers ERP should feel stable, predictable, and dense enough for professional workflows.

## Sidebar

**Purpose**

- Persistent ERP application shell navigation
- Module switching
- Nested operational navigation

**Core rules**

- Expanded width: `260px`
- Collapsed width: `92px`
- Expanded state shows full logo and left-arrow toggle
- Collapsed state uses the favicon as the reopen control
- Active item uses soft maroon background, left indicator, and active text
- Use thin borders instead of shadow-heavy separation

**Design guidance**

- Only top-level modules use icons.
- Child items use bullet-based hierarchy, not submenu icons.
- Keep active indicators aligned to the left edge.
- Preserve compact enterprise density.

## Tabs

Published navigation tokens:

- `theme.navigation.tabs`
- `theme.navigation.tabs.default`
- `theme.navigation.tabs.active`
- `theme.navigation.tabs.disabled`
- `theme.navigation.tabs.scrollable`

Rules:

- Keep tabs on one line.
- Use maroon indicator for active state.
- Use subtle background tint on hover.
- Do not wrap long tab labels.

## Breadcrumb

Published navigation tokens:

- `theme.navigation.breadcrumb`
- `theme.navigation.breadcrumb.default`
- `theme.navigation.breadcrumb.longPath`
- `theme.navigation.breadcrumb.collapsed`
- `theme.navigation.breadcrumb.clickable`

Rules:

- Use breadcrumbs for deep transactional pages.
- Last item is current page text, not a link.
- Collapse only when the path becomes long.

## Pagination

Published navigation tokens:

- `theme.navigation.pagination`
- `theme.navigation.pagination.summary`
- `theme.navigation.pagination.rowsPerPage`
- `theme.navigation.pagination.controls`
- `theme.navigation.pagination.goToPage`
- `theme.navigation.pagination.status`

Rules:

- Keep pagination on a single line where possible.
- Keep page change controls compact.
- Selected page should use brand maroon treatment.

## Page Header

Published navigation tokens:

- `theme.navigation.header`
- `theme.navigation.header.breadcrumb`
- `theme.navigation.header.titleBlock`
- `theme.navigation.header.secondaryAction`
- `theme.navigation.header.primaryAction`

Rules:

- Breadcrumb above title block where needed
- clear page title
- concise subtitle
- primary and secondary actions grouped to the right on larger screens

## Navigation States

Published navigation state tokens:

- `theme.navigation.states`
- `theme.navigation.states.default`
- `theme.navigation.states.hover`
- `theme.navigation.states.focused`
- `theme.navigation.states.active`
- `theme.navigation.states.selected`
- `theme.navigation.states.expanded`
- `theme.navigation.states.collapsed`
- `theme.navigation.states.disabled`

These states should apply consistently across sidebar items, tabs, and navigation-adjacent controls.

---

# 14. Application Layout Standards

Every ERP screen should follow the same page structure so users can scan and operate modules without relearning layout behavior.

## Standard Layout Hierarchy

```text
Page Header
    |
    v
Action Toolbar
    |
    v
Filter Section (Optional)
    |
    v
Main Content
    |
    v
Pagination (if required)
```

## Layout Rules

- Page title should always be left aligned.
- Primary actions should always be right aligned.
- Filters should always appear above tables.
- Action toolbar should remain below the page header.
- Pagination should always remain below the main content.
- Never place primary action buttons below a table.
- Maintain consistent spacing between sections using design tokens.
- Every ERP module should follow this layout.

This structure keeps pages predictable and ensures that all modules share the same enterprise reading and action flow.

---

# 15. Standard CRUD Pattern

Every ERP module should follow a consistent CRUD page flow wherever that pattern applies.

## Standard Pages

- List
- Create
- Edit
- View

## Standard Navigation Flow

```text
List
    |
    v
Create

List
    |
    v
Edit

List
    |
    v
View
```

## CRUD Rules

- Delete should always be initiated from the List page.
- Do not create dedicated Delete pages.
- Reuse the same Form component for Create and Edit pages.
- View pages should always be read-only.
- Keep page behavior consistent across every ERP module.

This pattern reduces implementation variance and makes feature behavior predictable across the entire ERP.

---

# 16. Component Tokens

This section is the official token reference for designers and developers.

## 16.1 Foundation Tokens

| Group | Published Tokens |
|---|---|
| Brand | `theme.customTokens.brand.primary`, `theme.customTokens.brand.secondary`, `theme.customTokens.brand.primaryScale`, `theme.customTokens.brand.secondaryScale` |
| Surfaces | `theme.customTokens.surfaces.background`, `theme.customTokens.surfaces.surface`, `theme.customTokens.surfaces.alt`, `theme.customTokens.surfaces.paper` |
| Text | `theme.customTokens.text.primary`, `theme.customTokens.text.secondary`, `theme.customTokens.text.disabled`, `theme.customTokens.text.inverse` |
| Borders | `theme.customTokens.borders.default`, `theme.customTokens.borders.hover`, `theme.customTokens.borders.focus`, `theme.customTokens.borders.selected`, `theme.customTokens.borders.divider`, `theme.customTokens.borders.light`, `theme.customTokens.borders.strong` |
| Radius | `theme.customTokens.radius.sm`, `theme.customTokens.radius.md`, `theme.customTokens.radius.lg`, `theme.customTokens.radius.xl`, `theme.customTokens.radius.pill` |
| Elevation | `theme.customTokens.elevation.none`, `theme.customTokens.elevation.xs`, `theme.customTokens.elevation.sm`, `theme.customTokens.elevation.md`, `theme.customTokens.elevation.lg` |
| Spacing | `theme.spacing(0.5)`, `theme.spacing(1)`, `theme.spacing(1.5)`, `theme.spacing(2)`, `theme.spacing(2.5)`, `theme.spacing(3)`, `theme.spacing(4)`, `theme.spacing(5)`, `theme.spacing(6)`, `theme.spacing(8)` |
| Typography | `theme.customTokens.typographyScale.display`, `theme.typography.h1`, `theme.typography.h2`, `theme.typography.h3`, `theme.typography.subtitle1`, `theme.typography.body1`, `theme.typography.body2`, `theme.typography.caption`, `theme.typography.subtitle2` |

## 16.2 Icon Tokens

| Category | Published Tokens |
|---|---|
| Action icons | `theme.icons.save`, `theme.icons.submit`, `theme.icons.edit`, `theme.icons.delete`, `theme.icons.add`, `theme.icons.download`, `theme.icons.export`, `theme.icons.view`, `theme.icons.print`, `theme.icons.refresh`, `theme.icons.search`, `theme.icons.filter`, `theme.icons.upload`, `theme.icons.copy`, `theme.icons.close`, `theme.icons.more` |
| Sidebar icons | `theme.icons.sidebar.dashboard`, `theme.icons.sidebar.users`, `theme.icons.sidebar.masters`, `theme.icons.sidebar.inventory`, `theme.icons.sidebar.qc`, `theme.icons.sidebar.warehouse`, `theme.icons.sidebar.factory`, `theme.icons.sidebar.packing`, `theme.icons.sidebar.dispatch` |

## 16.3 Input Tokens

| Component | Published Tokens |
|---|---|
| Text Input | `theme.components.input.default`, `theme.components.input.filled`, `theme.components.input.focused`, `theme.components.input.helper`, `theme.components.input.error`, `theme.components.input.disabled`, `theme.components.input.readOnly` |
| Text Area | `theme.components.textarea.default`, `theme.components.textarea.helper`, `theme.components.textarea.error`, `theme.components.textarea.disabled`, `theme.components.textarea.readOnly` |
| Dropdown | `theme.components.select.default`, `theme.components.select.hover`, `theme.components.select.focused`, `theme.components.select.selected`, `theme.components.select.error`, `theme.components.select.disabled` |
| Date Picker | `theme.components.datePicker.default`, `theme.components.datePicker.selected`, `theme.components.datePicker.error` |
| Date Range Picker | `theme.components.dateRangePicker.default`, `theme.components.dateRangePicker.selectedRange`, `theme.components.dateRangePicker.error` |
| Toggle Switch | `theme.components.switch.off`, `theme.components.switch.on` |
| Checkbox | `theme.components.checkbox.unchecked`, `theme.components.checkbox.checked`, `theme.components.checkbox.indeterminate`, `theme.components.checkbox.disabled`, `theme.components.checkbox.disabledChecked` |
| File Input | `theme.components.input.file` |

## 16.4 Form Tokens

| Component | Published Tokens |
|---|---|
| Form layouts | `theme.forms.grid3`, `theme.forms.grid4`, `theme.forms.grid5` |
| Form line-item table | `theme.forms.dynamicTable` |

## 16.5 Data Display Tokens

| Component | Published Tokens |
|---|---|
| ERP tables | `theme.components.table.standard`, `theme.components.table.selectable` |

## 16.6 Navigation Tokens

| Component | Published Tokens |
|---|---|
| Tabs | `theme.navigation.tabs`, `theme.navigation.tabs.default`, `theme.navigation.tabs.active`, `theme.navigation.tabs.disabled`, `theme.navigation.tabs.scrollable` |
| Breadcrumb | `theme.navigation.breadcrumb`, `theme.navigation.breadcrumb.default`, `theme.navigation.breadcrumb.longPath`, `theme.navigation.breadcrumb.collapsed`, `theme.navigation.breadcrumb.clickable` |
| Pagination | `theme.navigation.pagination`, `theme.navigation.pagination.summary`, `theme.navigation.pagination.rowsPerPage`, `theme.navigation.pagination.controls`, `theme.navigation.pagination.goToPage`, `theme.navigation.pagination.status` |
| Page Header | `theme.navigation.header`, `theme.navigation.header.breadcrumb`, `theme.navigation.header.titleBlock`, `theme.navigation.header.secondaryAction`, `theme.navigation.header.primaryAction` |
| Navigation States | `theme.navigation.states`, `theme.navigation.states.default`, `theme.navigation.states.hover`, `theme.navigation.states.focused`, `theme.navigation.states.active`, `theme.navigation.states.selected`, `theme.navigation.states.expanded`, `theme.navigation.states.collapsed`, `theme.navigation.states.disabled` |
| Sidebar namespace | `theme.navigation.sidebar` |

## 16.7 Reserved Namespace Pattern For Future Expansion

These are not all currently published as discrete showcase tokens, but future additions should remain inside the same naming scheme:

```text
theme.components.select.open
theme.components.datePicker.focused
theme.components.datePicker.open
theme.components.datePicker.disabled
theme.components.switch.disabled
theme.components.table.header
theme.components.table.row
theme.components.table.actions
theme.components.button.primary
theme.components.button.secondary
```

Use the existing namespace structure when formalizing new states or components.

---

# 17. Best Practices

- Reuse the existing component patterns before designing new ones.
- Never hardcode colors, spacing, borders, or shadows.
- Use the published token system first.
- Keep labels consistent across similar workflows.
- Follow existing component states instead of inventing local ones.
- Use typography tokens for hierarchy rather than arbitrary font sizing.
- Keep form actions centered and stable.
- Keep tables dense but readable.
- Use the brand maroon as an accent, not as the entire interface.
- Extend namespaces instead of creating disconnected token names.

---

# 18. Do's and Don'ts

| Do | Don't |
|---|---|
| Use `theme.customTokens` and published component tokens | Hardcode `#741616`, `12px`, or custom shadows inline |
| Keep labels visible above inputs | Rely on placeholder text as the only label |
| Use custom themed selects and date pickers | Use native browser dropdown styling in ERP forms |
| Keep surfaces white or warm neutral | Fill large work areas with saturated maroon |
| Use thin borders and restrained elevation | Add heavy shadows or decorative gradients |
| Use one outlined Lucide icon language | Mix multiple icon styles or filled/random icons |
| Use centered `Cancel` and `Submit` actions in forms | Scatter form actions inconsistently |
| Use 3, 4, or 5-column form patterns depending on space | Invent new grid layouts without a strong need |
| Keep table actions inside overflow where needed | Place too many visible row buttons in dense tables |
| Extend token namespaces consistently | Create unrelated token names for similar states |

---

# 19. Future Components

The following component families should be added in future phases under the same design language and token structure:

| Future Component | Status | Notes |
|---|---|---|
| Charts | Placeholder | must use restrained enterprise palettes |
| Dialogs | Placeholder | compact, focused, low-shadow overlays |
| Notifications | Placeholder | semantic, concise, operational |
| Cards | Placeholder | utility surfaces, not decorative marketing cards |
| Timeline | Placeholder | approval and production flow tracking |
| Kanban | Placeholder | operational status boards |
| Tree View | Placeholder | deep master or hierarchy navigation |
| Calendar | Placeholder | planning and dispatch scheduling |
| Dashboard Widgets | Placeholder | executive and operational summaries |

## Future Expansion Rules

- Keep the current naming architecture.
- Publish tokens before proliferating variants.
- Preserve the Deluxe Veneers visual identity.
- Maintain the same spacing, radius, and typography system.
- Document every new state before introducing it in production.

---

# 20. ERP Application Architecture

The next phase of the Deluxe Veneers ERP is the application build phase. Before building business modules, the frontend must be organized into a scalable enterprise architecture that can support 100+ ERP screens without fragmenting the design system.

## Architecture Principles

- Do not modify the existing Component Library structure unless the design system itself is being enhanced intentionally.
- Keep the Component Library available as the official Design System reference.
- Reuse shared UI from the design system across all modules.
- Never duplicate reusable UI components inside features.
- Follow feature-based architecture.
- Separate business logic from reusable UI.
- Keep API access outside presentation components.
- Let every feature own its pages, services, hooks, types, constants, and utilities.

## Technology Baseline

- React
- TypeScript
- Material UI
- React Router
- Lucide Icons

> The Component Library must remain available under `Tools -> Component Library` and continue to serve as the design reference for all future ERP development.

---

# 21. Final Folder Structure

The production frontend should follow the structure below.

```text
src/
|-- app/
|   |-- App.tsx
|   |-- providers/
|   |-- config/
|   |-- store/
|   |-- hooks/
|   `-- constants/
|
|-- assets/
|   |-- images/
|   |-- icons/
|   |-- logo/
|   `-- fonts/
|
|-- components/
|   |-- buttons/
|   |   |-- PrimaryButton.tsx
|   |   |-- SecondaryButton.tsx
|   |   |-- IconButton.tsx
|   |   `-- index.ts
|   |
|   |-- forms/
|   |   |-- EnterpriseInput.tsx
|   |   |-- EnterpriseSelect.tsx
|   |   |-- EnterpriseDatePicker.tsx
|   |   |-- EnterpriseDateRangePicker.tsx
|   |   |-- EnterpriseTextarea.tsx
|   |   |-- EnterpriseCheckbox.tsx
|   |   |-- EnterpriseToggle.tsx
|   |   `-- index.ts
|   |
|   |-- tables/
|   |   |-- EnterpriseTable.tsx
|   |   |-- TableToolbar.tsx
|   |   |-- TablePagination.tsx
|   |   |-- ColumnFilter.tsx
|   |   |-- ColumnSelector.tsx
|   |   `-- index.ts
|   |
|   |-- navigation/
|   |   |-- Sidebar/
|   |   |-- Breadcrumb/
|   |   |-- Tabs/
|   |   |-- PageHeader/
|   |   `-- Pagination/
|   |
|   |-- feedback/
|   |   |-- Alert/
|   |   |-- Snackbar/
|   |   |-- Dialog/
|   |   `-- ConfirmationDialog/
|   |
|   |-- cards/
|   |-- badges/
|   |
|   |-- layouts/
|   |   |-- AppLayout/
|   |   |-- PageLayout/
|   |   |-- ContentLayout/
|   |   `-- FormLayout/
|   |
|   `-- common/
|       |-- Loader/
|       |-- EmptyState/
|       |-- ErrorState/
|       `-- NoData/
|
|-- features/
|   |-- dashboard/
|   |-- user-management/
|   |-- roles-permissions/
|   |
|   |-- masters/
|   |   |-- item-master/
|   |   |-- item-category-master/
|   |   |-- item-sub-category-master/
|   |   |-- color-master/
|   |   |-- customer-master/
|   |   |-- supplier-master/
|   |   |-- unit-master/
|   |   |-- gst-master/
|   |   |-- hsn-master/
|   |   |-- warehouse-location-master/
|   |   `-- currency-master/
|   |
|   |-- warehouse/
|   |   |-- warehouse-A/
|   |   |-- warehouse-B/
|   |   `-- warehouse-C/
|   |
|   |-- inventory/
|   |   |-- raw-veneer/
|   |   |-- veneer-blocks/
|   |   |-- plywood/
|   |   `-- mdf/
|   |
|   |-- factory/
|   |   |-- slicing/
|   |   |-- drying/
|   |   |-- pressing/
|   |   |-- finishing/
|   |   |-- cnc-fluting/
|   |   |-- embossing/
|   |   |-- sample-sheets/
|   |   `-- finish/
|   |
|   |-- packing/
|   `-- dispatch/
|
|-- pages/
|   `-- ComponentLibrary/
|
|-- routes/
|-- services/
|   |-- api/
|   |-- auth/
|   |-- dashboard/
|   |-- masters/
|   |-- inventory/
|   |-- warehouse/
|   |-- factory/
|   |-- packing/
|   `-- dispatch/
|
|-- theme/
|-- types/
|-- utils/
|-- styles/
|-- main.tsx
`-- vite-env.d.ts
```

## Folder Ownership Rules

- `app/` contains app-wide providers, configuration, global hooks, and core composition.
- `components/` contains reusable shared UI that is not business-module specific.
- `features/` contains ERP business domains and their local implementation logic.
- `pages/ComponentLibrary/` remains the design-system documentation surface.
- `routes/` centralizes route registration and composition.
- `services/` contains cross-feature API and integration layers.
- `theme/` contains the Deluxe Veneers token and theme system.

---

# 22. Feature Folder Structure

Every feature module must follow the same internal pattern so the ERP remains predictable as it scales.

Example:

```text
inventory/
`-- raw-veneer/
    |-- pages/
    |   |-- RawVeneerListPage.tsx
    |   |-- CreateRawVeneerPage.tsx
    |   |-- EditRawVeneerPage.tsx
    |   `-- ViewRawVeneerPage.tsx
    |
    |-- components/
    |   |-- RawVeneerTable.tsx
    |   |-- RawVeneerForm.tsx
    |   |-- RawVeneerFilters.tsx
    |   |-- RawVeneerDetails.tsx
    |   `-- index.ts
    |
    |-- services/
    |   |-- rawVeneerApi.ts
    |   `-- rawVeneerMapper.ts
    |
    |-- hooks/
    |   |-- useRawVeneer.ts
    |   `-- useRawVeneerFilters.ts
    |
    |-- types/
    |   `-- rawVeneer.ts
    |
    |-- constants/
    |-- utils/
    `-- index.ts
```

## Feature Rules

- Every feature must follow this structure.
- Page-level screens belong in `pages/`.
- Business-specific reusable view pieces belong in `components/`.
- API calls and DTO mapping belong in `services/`.
- Feature behavior and data orchestration belong in `hooks/`.
- Feature models and interfaces belong in `types/`.
- Static feature configuration belongs in `constants/`.
- Pure helper logic belongs in `utils/`.

---

# 23. Naming Standards

Consistent naming keeps the codebase predictable, improves onboarding, and makes features easier to find, refactor, and extend.

## Pages

| Purpose | Naming Pattern | Example |
|---|---|---|
| list page | `<Entity>ListPage.tsx` | `ItemListPage.tsx` |
| create page | `Create<Entity>Page.tsx` | `CreateItemPage.tsx` |
| edit page | `Edit<Entity>Page.tsx` | `EditItemPage.tsx` |
| view page | `View<Entity>Page.tsx` | `ViewItemPage.tsx` |

## Components

| Purpose | Naming Pattern | Example |
|---|---|---|
| table component | `<Entity>Table.tsx` | `ItemTable.tsx` |
| form component | `<Entity>Form.tsx` | `ItemForm.tsx` |
| filter component | `<Entity>Filters.tsx` | `ItemFilters.tsx` |
| details component | `<Entity>Details.tsx` | `ItemDetails.tsx` |
| reusable state badge | `<EntityOrState>Badge.tsx` | `StatusBadge.tsx` |
| reusable action row | `<EntityOrScope>Toolbar.tsx` | `ActionToolbar.tsx` |

## Hooks

| Purpose | Naming Pattern | Example |
|---|---|---|
| entity data hook | `use<Entity>.ts` | `useItem.ts` |
| filter hook | `use<Entity>Filters.ts` | `useItemFilters.ts` |
| create workflow hook | `useCreate<Entity>.ts` | `useCreateItem.ts` |

## Services

| Purpose | Naming Pattern | Example |
|---|---|---|
| API access | `<entity>Api.ts` | `itemApi.ts` |
| mapping layer | `<entity>Mapper.ts` | `itemMapper.ts` |

## Types

| Purpose | Naming Pattern | Example |
|---|---|---|
| entity model file | `<entity>.ts` | `item.ts` |
| supporting model file | `<entity>.ts` | `user.ts` |
| feature domain file | `<entity>.ts` | `dispatch.ts` |

## Constants

| Purpose | Naming Pattern | Example |
|---|---|---|
| entity constants | `<entity>Constants.ts` | `itemConstants.ts` |
| status constants | `<scope>Constants.ts` | `statusConstants.ts` |

Consistent naming improves maintainability by making files easier to discover, reducing ambiguity across features, and preserving a predictable mental model as the ERP grows.

---

# 24. Sidebar Modules and Structure

The ERP sidebar should contain only the primary modules defined below.

## Top-Level Sidebar Modules

- Dashboard
- User Management
- Roles & Permissions
- Masters
- Warehouse
- Inventory
- Factory
- Packing
- Dispatch
- Tools

## Sidebar Icon Mapping

Only top-level modules should have icons.

| Module | Lucide Icon | Usage Rule |
|---|---|---|
| Dashboard | `LayoutDashboard` | top-level only |
| User Management | `UsersRound` | top-level only |
| Roles & Permissions | `ShieldCheck` | top-level only |
| Masters | `Star` | top-level only |
| Warehouse | `Warehouse` | top-level only |
| Inventory | `Boxes` | top-level only |
| Factory | `Factory` | top-level only |
| Packing | `PackageOpen` | top-level only |
| Dispatch | `Truck` | top-level only |
| Tools | `Wrench` | top-level only |

## Submenu Rule

- Submenus must not have icons.
- Use a simple bullet (`*` in markdown, rendered as a bullet in UI documentation) before submenu items in documentation and a bullet marker in the actual sidebar UI pattern.

## Sidebar Structure

```text
Dashboard

User Management

Roles & Permissions

Masters
    - Item Master
    - Customer Master
    - Unit Master
    - Supplier Master
    - GST Master
    - HSN Master
    - Warehouse/Location Master

Warehouse
    - Warehouse A QC Approval
    - Warehouse B QC Done
    - Warehouse C Production Stock

Inventory
    - Raw Veneer
    - Veneer Blocks
    - Plywood
    - MDF

Factory
    - Slicing
    - Drying
    - Pressing
    - Finishing
    - CNC/Fluting
    - Embossing
    - Sample Sheets
    - Finish

Packing

Dispatch

Tools
    - Component Library
```

## Sidebar Implementation Guidance

- Keep the current Deluxe Veneers sidebar visual language.
- Keep the Component Library under `Tools -> Component Library`.
- Use the existing active state treatment from the design system.
- Preserve the compact enterprise spacing already established.

---

# 25. Coding Standards

Frontend implementation should follow these coding standards consistently across all shared components, features, hooks, and pages.

- Use functional React components.
- Use TypeScript everywhere.
- Prefer interfaces over type aliases for component props.
- Keep components small and reusable.
- One component should have one responsibility.
- Avoid inline styles except for small MUI `sx` overrides.
- Reuse shared components whenever possible.
- Avoid duplicate business logic.
- Keep API calls inside the services layer.
- Keep feature-specific hooks inside feature folders.
- Keep reusable hooks inside `app/hooks`.
- Export reusable components through `index.ts`.
- Follow the established folder structure.
- Use the Deluxe Veneers design tokens instead of hardcoded values.
- Follow consistent naming conventions.
- Write readable and maintainable code.

Consistency, reusability, and maintainability are more important than creating new custom UI patterns.

---

# 26. Development Rules

The ERP application must follow these implementation rules consistently.

- Never duplicate reusable UI components.
- Always consume reusable UI from the shared `components/` directory.
- Business logic belongs inside the corresponding feature.
- API calls must remain inside `services/`.
- Feature-specific hooks stay inside the feature folder.
- Global reusable hooks belong in `app/hooks`.
- Never hardcode colors, spacing, typography, border radius, or shadow values.
- Always use the Deluxe Veneers design tokens and MUI theme.
- All forms must use the standardized Grid-3, Grid-4, or Grid-5 layout patterns.
- All listing screens must use the reusable `EnterpriseTable`.

## Standard Page Structure

Every new page should follow the Application Layout Standards defined earlier in this document, including page header, action toolbar, optional filters, main content, and pagination in that order.

## Reuse Hierarchy

- Design tokens first
- Shared reusable components second
- Feature-owned business components third
- Page composition last

This order prevents one-off implementations from bypassing the design system.

---

# 27. Implementation Objective

The immediate objective is to refactor the frontend into the target enterprise architecture without breaking the current Component Library.

## Required Outcome

- The Component Library remains intact.
- The Component Library remains accessible under `Tools -> Component Library`.
- The library continues to serve as the official reusable design system.
- Future ERP modules are built on the feature-based structure defined in this document.
- Shared UI stays centralized.
- Business logic stays feature-owned.

## Success Criteria

- A scalable frontend structure exists before module implementation begins.
- The navigation architecture supports the final ERP module map.
- Shared components are reused across features.
- New screens can be added without restructuring the app again.

> Final principle: build the ERP on top of the Component Library, not beside it.
