# Requirements Document

## Introduction

This document defines requirements for redesigning the Customer View and Kitchen View dashboards to align with the Investigation Console's design system, creating a cohesive visual identity across the InfoMeTrace application while preserving all existing functionality.

## Glossary

- **Customer_View**: The customer-facing dashboard component (CustomerView.tsx)
- **Kitchen_View**: The kitchen partner dashboard component (KitchenView.tsx)
- **Investigation_Console**: The reference component with the target design system
- **Design_System**: The set of visual design tokens (colors, typography, spacing) defined in index.css
- **Functionality**: The interactive behaviors, data fetching, and state management logic
- **UI_Element**: Any visual component (card, button, header, badge, etc.)

## Requirements

### Requirement 1: Apply Design System Colors

**User Story:** As a developer, I want both dashboards to use Investigation Console's color palette, so that the application has a consistent visual identity.

#### Acceptance Criteria

1. THE Customer_View SHALL use `bg-canvas` (#F7F7F5) for the main background instead of gradient backgrounds
2. THE Kitchen_View SHALL use `bg-canvas` (#F7F7F5) for the main background instead of gradient backgrounds
3. WHEN rendering card components, THE Customer_View SHALL use `bg-surface` (#FFFFFF) with `border-ui-border` (#D9DADD) borders instead of white cards with shadows
4. WHEN rendering card components, THE Kitchen_View SHALL use `bg-surface` (#FFFFFF) with `border-ui-border` (#D9DADD) borders instead of white cards with shadows
5. THE Customer_View SHALL use `text-ink` (#171719) for primary text instead of gray-900
6. THE Kitchen_View SHALL use `text-ink` (#171719) for primary text instead of gray-900
7. THE Customer_View SHALL use `text-muted` (#52545A) for secondary text instead of gray-500/gray-600
8. THE Kitchen_View SHALL use `text-muted` (#52545A) for secondary text instead of gray-500/gray-600
9. THE Customer_View SHALL use `bg-maroon` (#6E1F2A) for primary action buttons instead of orange/green gradients
10. THE Kitchen_View SHALL use `bg-maroon` (#6E1F2A) for primary action buttons instead of orange/green gradients
11. THE Customer_View SHALL use `bg-burgundy` (#3B1118) for button hover states instead of orange-700/green-700
12. THE Kitchen_View SHALL use `bg-burgundy` (#3B1118) for button hover states instead of orange-700/green-700

### Requirement 2: Update Typography System

**User Story:** As a designer, I want both dashboards to use Investigation Console's typography, so that text hierarchy and readability are consistent.

#### Acceptance Criteria

1. THE Customer_View SHALL use IBM Plex Sans (font-sans) for all body text instead of default sans-serif
2. THE Kitchen_View SHALL use IBM Plex Sans (font-sans) for all body text instead of default sans-serif
3. THE Customer_View SHALL use IBM Plex Mono (font-mono) for all code-like identifiers (order IDs, batch IDs)
4. THE Kitchen_View SHALL use IBM Plex Mono (font-mono) for all code-like identifiers (order IDs, batch IDs)
5. WHEN rendering section headers, THE Customer_View SHALL use uppercase text with `tracking-widest` letter spacing
6. WHEN rendering section headers, THE Kitchen_View SHALL use uppercase text with `tracking-widest` letter spacing
7. WHEN rendering labels, THE Customer_View SHALL use text size `text-[10px]` with `font-bold` and `tracking-widest`
8. WHEN rendering labels, THE Kitchen_View SHALL use text size `text-[10px]` with `font-bold` and `tracking-widest`

### Requirement 3: Redesign Header Components

**User Story:** As a user, I want dashboard headers to match Investigation Console's clean design, so that navigation feels unified.

#### Acceptance Criteria

1. THE Customer_View SHALL replace the gradient header with a white `bg-surface` header
2. THE Kitchen_View SHALL replace the gradient header with a white `bg-surface` header
3. WHEN rendering the header, THE Customer_View SHALL add `border-b border-ui-border` instead of gradient styling
4. WHEN rendering the header, THE Kitchen_View SHALL add `border-b border-ui-border` instead of gradient styling
5. THE Customer_View SHALL style the location label with uppercase `text-[10px]` tracking-widest text
6. THE Kitchen_View SHALL style the kitchen name label with uppercase `text-[10px]` tracking-widest text
7. THE Customer_View SHALL maintain the notification bell icon and red dot indicator functionality
8. THE Kitchen_View SHALL maintain the notification bell icon and red dot indicator functionality
9. THE Customer_View SHALL maintain the menu icon functionality
10. THE Kitchen_View SHALL maintain the menu icon functionality
11. THE Customer_View SHALL maintain the search bar but style it with Investigation Console borders
12. THE Kitchen_View SHALL maintain the search bar but style it with Investigation Console borders

### Requirement 4: Redesign Card Components

**User Story:** As a user, I want order and batch cards to use Investigation Console's card design, so that information is presented consistently.

#### Acceptance Criteria

1. THE Customer_View SHALL remove rounded-2xl styling from all cards
2. THE Kitchen_View SHALL remove rounded-2xl styling from all cards
3. THE Customer_View SHALL apply sharp corners (no border-radius) to all card elements
4. THE Kitchen_View SHALL apply sharp corners (no border-radius) to all card elements
5. THE Customer_View SHALL use 2px borders (`border-2`) on cards instead of 1px
6. THE Kitchen_View SHALL use 2px borders (`border-2`) on cards instead of 1px
7. WHEN a card is contaminated/recalled, THE Customer_View SHALL use `border-critical` (#B42318) for the border
8. WHEN a batch is contaminated, THE Kitchen_View SHALL use `border-critical` (#B42318) for the border
9. THE Customer_View SHALL replace shadow-sm with clean borders only
10. THE Kitchen_View SHALL replace shadow-sm with clean borders only

### Requirement 5: Redesign Status Badges

**User Story:** As a user, I want status indicators to use Investigation Console's badge design, so that status information is immediately recognizable.

#### Acceptance Criteria

1. THE Customer_View SHALL render "DELIVERED" status badges in uppercase with `tracking-widest`
2. THE Customer_View SHALL render "RECALLED" status badges in uppercase with `tracking-widest`
3. THE Kitchen_View SHALL render "SAFE" status badges in uppercase with `tracking-widest`
4. THE Kitchen_View SHALL render "CONTAMINATED" status badges in uppercase with `tracking-widest`
5. WHEN an order is delivered, THE Customer_View SHALL style the badge with `bg-verified-soft` background and `text-verified` text
6. WHEN an order is recalled, THE Customer_View SHALL style the badge with `bg-critical-soft` background and `text-critical` text
7. WHEN a batch is safe, THE Kitchen_View SHALL style the badge with `bg-verified-soft` background and `text-verified` text
8. WHEN a batch is contaminated, THE Kitchen_View SHALL style the badge with `bg-critical-soft` background and `text-critical` text
9. THE Customer_View SHALL remove rounded-full styling from badges
10. THE Kitchen_View SHALL remove rounded-full styling from badges

### Requirement 6: Redesign Button Components

**User Story:** As a user, I want all buttons to match Investigation Console's button design, so that interactive elements are consistent.

#### Acceptance Criteria

1. THE Customer_View SHALL style primary buttons with `bg-maroon` background and white text
2. THE Kitchen_View SHALL style primary buttons with `bg-maroon` background and white text
3. THE Customer_View SHALL apply uppercase text with `tracking-widest` to all buttons
4. THE Kitchen_View SHALL apply uppercase text with `tracking-widest` to all buttons
5. THE Customer_View SHALL remove all rounded corners from buttons
6. THE Kitchen_View SHALL remove all rounded corners from buttons
7. WHEN a button is hovered, THE Customer_View SHALL change background to `bg-burgundy`
8. WHEN a button is hovered, THE Kitchen_View SHALL change background to `bg-burgundy`
9. THE Customer_View SHALL maintain all existing button functionality (onClick handlers)
10. THE Kitchen_View SHALL maintain all existing button functionality (onClick handlers)

### Requirement 7: Redesign Login Screen

**User Story:** As a user, I want login screens to match Investigation Console's aesthetic, so that the first impression is consistent.

#### Acceptance Criteria

1. THE Customer_View SHALL replace gradient background with `bg-canvas` on login screen
2. THE Kitchen_View SHALL replace gradient background with `bg-canvas` on login screen
3. THE Customer_View SHALL style login input with `border-ui-border` and sharp corners
4. THE Kitchen_View SHALL style login input with `border-ui-border` and sharp corners
5. THE Customer_View SHALL style the login button with `bg-maroon` and uppercase text
6. THE Kitchen_View SHALL style the login button with `bg-maroon` and uppercase text
7. THE Customer_View SHALL maintain all login functionality (authentication, validation)
8. THE Kitchen_View SHALL maintain all login functionality (authentication, validation)

### Requirement 8: Preserve Existing Functionality

**User Story:** As a user, I want all interactive features to continue working exactly as before, so that the redesign is purely visual.

#### Acceptance Criteria

1. THE Customer_View SHALL maintain polling for customer data every 5 seconds
2. THE Kitchen_View SHALL maintain polling for batch data every 5 seconds
3. THE Customer_View SHALL maintain order-batch mapping logic
4. THE Kitchen_View SHALL maintain batch status checking logic
5. THE Customer_View SHALL maintain expandable order details functionality
6. THE Kitchen_View SHALL maintain expandable batch details functionality
7. THE Customer_View SHALL maintain notification bell click handler
8. THE Kitchen_View SHALL maintain notification bell click handler
9. THE Customer_View SHALL maintain recall message fetching and display
10. THE Kitchen_View SHALL maintain compliance checklist state management
11. THE Customer_View SHALL maintain logout functionality
12. THE Kitchen_View SHALL maintain logout functionality

### Requirement 9: Update Alert and Notification Styling

**User Story:** As a user, I want alerts and notifications to use Investigation Console's styling, so that critical information is presented consistently.

#### Acceptance Criteria

1. THE Customer_View SHALL style recall alerts with `bg-critical-soft` background and `border-critical` left border
2. THE Kitchen_View SHALL style contamination alerts with `bg-critical-soft` background and `border-critical` left border
3. THE Customer_View SHALL use uppercase text for alert headings
4. THE Kitchen_View SHALL use uppercase text for alert headings
5. THE Customer_View SHALL maintain alert icon (AlertTriangle) display
6. THE Kitchen_View SHALL maintain alert icon (AlertTriangle) display
7. THE Customer_View SHALL remove rounded corners from alert boxes
8. THE Kitchen_View SHALL remove rounded corners from alert boxes

### Requirement 10: Update Spacing and Layout Structure

**User Story:** As a developer, I want dashboards to use Investigation Console's spacing system, so that visual rhythm is consistent.

#### Acceptance Criteria

1. THE Customer_View SHALL use consistent padding of `px-4` and `py-4` for sections
2. THE Kitchen_View SHALL use consistent padding of `px-4` and `py-4` for sections
3. THE Customer_View SHALL maintain responsive layout behavior
4. THE Kitchen_View SHALL maintain responsive layout behavior
5. THE Customer_View SHALL keep existing gap spacing between cards and sections
6. THE Kitchen_View SHALL keep existing gap spacing between cards and sections
7. THE Customer_View SHALL maintain sticky header positioning
8. THE Kitchen_View SHALL maintain sticky header positioning
