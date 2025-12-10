# BodAI Dojo Phase 2: The Briefing Room & Smart Warm-ups

## 1. The "Briefing Room" (Mission Modal)
Instead of navigating immediately, we open a focused "Briefing" modal.

### Design Philosophy
*   **Minimalist:** No badges, no complex icons. Just typography and space.
*   **Focus:** The text (The "What" and "Why") is the hero.
*   **Backdrop:** Dimmed overlay to separate from the dashboard.

### Functional Specs
**Triggers:** Clicking "Start Session" (Hero) or "Play" (Stations).

**Modal Content:**
1.  **Header:**
    *   "Back" button (Top Left) - Simple text or arrow.
    *   Title: The Mission Name (e.g., "Eye Contact Drill").
2.  **Body (Scrollable if needed):**
    *   Full Description (`what_to_do`).
    *   Context (`why_it_matters`).
3.  **Footer (Actions):**
    *   **Primary Button:** "Go to Studio / Start Recording" -> Navigates to `/new-analysis` with the prompt active.
    *   **Secondary Button:** "Did it, thank you!" -> Marks the item as `completed` in the DB *without* a recording (Manual Rep), triggers a confetti celebration, and closes the modal.

---

## 2. Smart Warm-ups Engine
We will move from static hardcoded drills to a **Dynamic Drill Bank**.

### The Drill Bank Structure
We will create a library of ~15-20 micro-drills, each tagged with:
*   `id`
*   `category` (voice, presence, energy, clarity, etc.)
*   `title` (Fun & Professional, e.g., "The Lion Roar", "Velvet Voice")
*   `instruction` (1 sentence)
*   `duration` (e.g., "30 sec")

### Selection Logic (The "Smart" Part)
1.  **Input:** The user's `weaknesses` array (already calculated in PracticePage).
2.  **Algorithm:**
    *   **Slot 1 (Priority):** Select a drill matching the #1 Weakness.
    *   **Slot 2 (Secondary):** Select a drill matching the #2 Weakness (or #1 if only one exists).
    *   **Slot 3 (Wildcard):** Select a generic "Confidence Booster" or "Energy" drill for variety.
3.  **Fallback:** If no specific weakness is found, shuffle the "General" drills.

### Interaction
*   Clicking a Warm-up card opens a **Simplified Modal**:
    *   Instruction text.
    *   Timer (optional, or just "Did it" button).
    *   "Did it!" button -> Celebrates and greys out the card for the session.

---

## 3. Implementation Plan

### Step 1: Data Layer (`client/src/data/drillBank.js`)
Create the constant file with the drill content (English & Hebrew support keys).

### Step 2: Component - `MissionModal`
Build the reusable modal component with the 3 required actions.

### Step 3: Logic - `PracticePage.jsx`
*   Update `WarmUpRow` to accept `weaknesses` and implement the selection logic.
*   Add `selectedMission` state to manage the modal visibility.
*   Implement `handleManualCompletion` to update the DB without navigation.

### Step 4: Translation
Add all new strings (Drill titles, instructions, Modal buttons) to `en` and `he` locales.




