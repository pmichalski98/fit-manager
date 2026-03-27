# Food Tracking — Implementation Plan

## Phase 1: Database Foundation

### Task 1.1 — Enable pg_trgm extension
Create a Drizzle migration to enable the `pg_trgm` PostgreSQL extension for fuzzy search support.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Task 1.2 — Add shopping_category table
Create the `shopping_category` table in the Drizzle schema:
- `id`, `user_id`, `name`, `position`, `created_at`, `updated_at`
- Index on `(user_id, position)`

### Task 1.3 — Add food_product table
Create the `food_product` table:
- All fields from design (name, brand, category_id FK, source, source_id, image_url, is_verified, macros per 100g, default_serving_g)
- GIN trigram index on `name` for fuzzy search
- Unique index on `(user_id, source, source_id)`

### Task 1.4 — Add meal_entry table
Create the `meal_entry` table:
- `meal_type_enum` pgEnum: "breakfast" | "lunch" | "dinner" | "snack"
- All fields from design including `notes`
- Indexes on `(user_id, date)` and `(user_id, date, meal_type)`

### Task 1.5 — Add meal_template + meal_template_item tables
Create both tables for reusable meals.

### Task 1.6 — Extend user table with macro goals
Add columns: `protein_goal`, `carbs_goal`, `fat_goal`, `fiber_goal` (all INTEGER, nullable).

### Task 1.7 — Add OPENAI_API_KEY to env validation
Update `src/env.js` to include `OPENAI_API_KEY` as a server-side env var.

### Task 1.8 — Run migration
Generate and apply the Drizzle migration.

---

## Phase 2: Core Services

### Task 2.1 — OpenFoodFacts API client
Create `src/modules/food/services/openfoodfacts.ts`:
- `searchProducts(query: string): Promise<FoodProductFromAPI[]>` — search with `cc=pl&lc=pl`
- `getProduct(barcode: string): Promise<FoodProductFromAPI | null>` — single product lookup
- Map API response to internal `FoodProduct` shape
- Handle timeouts (3s), errors, incomplete data gracefully

### Task 2.2 — OpenAI AI service
Create `src/modules/food/services/ai-nutrition.ts`:
- `estimateMacros(productName: string): Promise<MacroEstimate>` — GPT-4o-mini for macro estimation
- `generateFoodPhoto(productName: string): Promise<string>` — DALL-E 3 photo, returns S3 URL after upload
- `categorizeProduct(productName: string, brand: string, categories: string[]): Promise<string>` — GPT-4o-mini category assignment
- Install `openai` npm package

### Task 2.3 — Food repository with fuzzy search
Create `src/modules/food/repositories/food.repo.ts`:
- `searchByName(userId, query)` — fuzzy search using `similarity()` + `ILIKE` fallback
- `findBySourceId(userId, source, sourceId)` — dedup check
- `create(product)`, `update(id, data)`, `delete(id)`
- `getAll(userId)` — for product database browser

### Task 2.4 — Meal repository
Create `src/modules/meal/repositories/meal.repo.ts`:
- `getEntriesByDateRange(userId, startDate, endDate)` — for planner + shopping list
- `getEntriesByDate(userId, date)` — single day
- `createEntry(entry)`, `updateEntry(id, data)`, `deleteEntry(id)`
- `getDailyMacroSummary(userId, date)` — SUM of macros for a day

### Task 2.5 — Shopping repository
Create `src/modules/shopping/repositories/shopping.repo.ts`:
- `getCategories(userId)` — ordered by position
- `createCategory(userId, name, position)`
- `updateCategory(id, data)`, `deleteCategory(id)`
- `reorderCategories(userId, orderedIds[])`
- `seedDefaultCategories(userId)` — initial setup

---

## Phase 3: Server Actions

### Task 3.1 — Food actions
Create `src/modules/food/actions.ts`:
- `searchFood(query)` — orchestrates: fuzzy local search → OpenFoodFacts → merge results
- `addFoodProduct(data)` — manual entry, triggers AI categorization + photo generation
- `importFromOpenFoodFacts(apiProduct)` — saves to personal DB, triggers AI categorization + photo
- `estimateWithAI(productName)` — AI macro estimation, saves result
- `updateFoodProduct(id, data)` — edit product, set is_verified
- `deleteFoodProduct(id)`
- `getAllProducts()` — for product database page

### Task 3.2 — Meal actions
Create `src/modules/meal/actions.ts`:
- `addMealEntry(date, mealType, productId, amountG, notes?)` — create entry with computed macros
- `updateMealEntry(id, data)` — update amount/notes, recompute macros
- `deleteMealEntry(id)`
- `getMealPlanForDays(startDate, days)` — fetch entries for 3-day planner
- `syncDailyLogFromMeals(userId, date)` — update dailyLog.kcal from meal entries
- `saveMealAsTemplate(name, mealType, entries[])` — save current meal as template
- `applyMealTemplate(templateId, date, mealType)` — populate entries from template

### Task 3.3 — Shopping actions
Create `src/modules/shopping/actions.ts`:
- `generateShoppingList(dates[])` — aggregate entries, group by category, sum amounts
- `getShoppingCategories()` — get user's categories
- `createShoppingCategory(name)` — add new category
- `updateShoppingCategory(id, name)` — rename
- `deleteShoppingCategory(id)` — remove (reassign products to "Other")
- `reorderShoppingCategories(orderedIds[])` — update positions

### Task 3.4 — Extend user actions for macro goals
Update `src/modules/body/actions.ts` (or create new):
- `updateMacroGoals(proteinGoal, carbsGoal, fatGoal, fiberGoal)`
- `getMacroGoals()` — fetch current goals

### Task 3.5 — Zod schemas
Create validation schemas:
- `src/modules/food/schemas.ts` — FoodProductSchema, FoodSearchSchema
- `src/modules/meal/schemas.ts` — MealEntrySchema, MealTemplateSchema
- `src/modules/shopping/schemas.ts` — ShoppingCategorySchema, ShoppingListRequestSchema

---

## Phase 4: UI — Meal Planner (Core Page)

### Task 4.1 — Food page route
Create `src/app/(protected)/food/page.tsx` with the 3-day planner layout.

### Task 4.2 — MealPlanner component
Create `src/modules/meal/ui/meal-planner.tsx`:
- 3-day grid layout (desktop: 3 columns, mobile: swipeable single column)
- Navigation arrows to shift days forward/back
- Date display with day name and total kcal per day
- Macro progress bar (compact) in each day header

### Task 4.3 — DayColumn component
Create `src/modules/meal/ui/day-column.tsx`:
- Renders 4 meal sections: Breakfast, Lunch, Dinner, Snacks
- Shows day total kcal prominently
- Compact macro breakdown

### Task 4.4 — MealSection component
Create `src/modules/meal/ui/meal-section.tsx`:
- Collapsible section header with meal type name + subtotal kcal
- Grid of MealEntryCard components
- [+] button to open food search modal

### Task 4.5 — MealEntryCard component
Create `src/modules/meal/ui/meal-entry-card.tsx`:
- Card with food photo (or placeholder), kcal, truncated product name
- Notes indicator icon (if notes exist)
- Click to edit (amount, notes) or delete
- Compact design matching Fitatu-style cards

### Task 4.6 — MacroSummary component
Create `src/modules/meal/ui/macro-summary.tsx`:
- Progress bars for kcal, protein, carbs, fat, fiber vs goals
- Used in day header and potentially in an expanded detail view

---

## Phase 5: UI — Food Search & Product Management

### Task 5.1 — FoodSearch modal/dialog
Create `src/modules/food/ui/food-search.tsx`:
- Search input with debounced fuzzy search (300ms)
- Results list showing: product name, brand, kcal/100g, source indicator
- Sections: "Your products" (local DB) and "Online results" (OpenFoodFacts)
- "Not found? Let AI estimate" button → triggers AI estimation
- On select: show amount input (g) + optional notes → add to meal

### Task 5.2 — FoodProductForm
Create `src/modules/food/ui/food-product-form.tsx`:
- Manual product entry form: name, brand, macros per 100g, category, serving size
- Used for: manual entry, editing existing product, verifying AI estimates

### Task 5.3 — Products page
Create `src/app/(protected)/food/products/page.tsx`:
- Personal food database browser
- List/grid of all user's products with search/filter
- Edit/delete actions
- Source indicator (OpenFoodFacts / AI estimate / Manual)
- Verification status indicator

---

## Phase 6: UI — Shopping List

### Task 6.1 — ShoppingListGenerator
Create `src/modules/shopping/ui/shopping-list-generator.tsx`:
- Date range/day selector (multi-select on calendar or date pickers)
- "Generate List" button
- Displays results in ShoppingListView

### Task 6.2 — ShoppingListView
Create `src/modules/shopping/ui/shopping-list-view.tsx`:
- Grouped by shopping categories in user's custom order
- Each item: product name, total amount (summed across selected days)
- Checkboxes to mark items as bought
- "Copy as text" button for sharing

### Task 6.3 — CategoryManager
Create `src/modules/shopping/ui/category-manager.tsx`:
- List of user's shopping categories
- Drag-and-drop reorder (using @dnd-kit)
- Add/rename/delete categories
- Accessible from `/food/settings`

---

## Phase 7: UI — Settings & Goals

### Task 7.1 — Food settings page
Create `src/app/(protected)/food/settings/page.tsx`:
- Macro goals configuration (protein, carbs, fat, fiber in grams)
- Shopping category management (embedded CategoryManager)

### Task 7.2 — Extend caloric goal dialog
Update existing caloric goal UI to also show/edit macro goals, or link to `/food/settings`.

---

## Phase 8: Navigation & Polish

### Task 8.1 — Add Food to navigation
Update `src/lib/navigation.ts` to include Food nav item with UtensilsIcon.

### Task 8.2 — Mobile responsive planner
Ensure 3-day planner works on mobile:
- Single-day view with horizontal swipe gestures
- Bottom nav integration

### Task 8.3 — Seed default shopping categories
Add logic to seed default categories on first visit to food page (if user has none).

### Task 8.4 — DailyLog integration
Wire up `syncDailyLogFromMeals` to update `dailyLog.kcal` whenever meal entries change, so dashboard charts reflect food tracking data.

---

## Implementation Order & Dependencies

```
Phase 1 (DB) → Phase 2 (Services) → Phase 3 (Actions) → Phase 4-7 (UI, parallel) → Phase 8 (Polish)
```

Phases 4, 5, 6, 7 can be worked on somewhat in parallel once Phase 3 is done, but the natural flow is:
- Phase 4 first (core planner page — the main UX)
- Phase 5 next (food search — needed to actually add food to the planner)
- Phase 6 (shopping list — builds on existing meal data)
- Phase 7 (settings — can be done anytime)
