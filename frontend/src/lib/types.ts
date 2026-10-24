export type EventType = "wedding" | "birthday" | "community";
export type CityTier = "metro" | "tier2" | "small_town";
export type DietaryOption = "vegetarian" | "vegan" | "jain" | "halal" | "gluten_free" | "none";
export type IndoorOutdoor = "indoor" | "outdoor" | "either";
export type PriorityCategory = "food" | "decor" | "music" | "photography" | "venue" | "entertainment";
export type AgeGroup = "kids" | "teens" | "adults" | "seniors" | "mixed";
export type AllowedCurrency = "INR" | "USD" | "EUR" | "GBP";

export interface EventPreferences {
  theme?: string;
  dietary: DietaryOption[];
  indoor_outdoor: IndoorOutdoor;
  priorities: PriorityCategory[];
  age_group?: AgeGroup;
  notes?: string;
}

export interface EventRequest {
  event_type: EventType;
  title: string;
  guest_count: number;
  total_budget: number;
  currency: AllowedCurrency;
  event_date: string;
  location: string;
  city_tier?: CityTier;
  preferences: EventPreferences;
}

export interface BudgetCategoryItem {
  name: string;
  percentage: number;
  amount: number;
  reasoning: string;
}

export interface BudgetPlan {
  event_type: EventType;
  total_budget: number;
  currency: AllowedCurrency;
  per_guest_cost: number;
  categories: BudgetCategoryItem[];
  total_allocated: number;
  contingency_percentage: number;
  contingency_amount: number;
  benchmark_warnings: string[];
  notes: string[];
}

export interface TimelineTaskItem {
  title: string;
  category: string;
  due_date: string;
  days_before_event: number;
  phase: string;
  is_urgent: boolean;
  description: string;
}

export interface RunOfShowItem {
  time_offset_hours: number;
  time_label: string;
  duration_minutes: number;
  title: string;
  description: string;
  owner: string;
}

export interface TimelinePlan {
  event_type: EventType;
  event_date: string;
  days_remaining: number;
  is_compressed: boolean;
  lead_benchmark_days: number;
  phases: Record<string, TimelineTaskItem[]>;
  all_tasks_sorted: TimelineTaskItem[];
  run_of_show: RunOfShowItem[];
}

export interface VendorRequirementItem {
  vendor_type: string;
  booking_deadline: string;
  allocated_budget: number;
  interview_questions: string[];
  red_flags: string[];
  required_documents: string[];
}

export interface VendorChecklist {
  event_type: EventType;
  recommended_vendors: VendorRequirementItem[];
  skipped_vendors: Record<string, string>;
}

export interface ThemeConcept {
  name: string;
  description: string;
  color_palette: string[];
}

export interface DecorSuggestion {
  area: string;
  idea: string;
  diy_tip?: string;
}

export interface MenuRecommendation {
  course: string;
  dishes: string[];
  dietary_note?: string;
}

export interface ActivityItem {
  time_slot: string;
  activity: string;
  age_relevance?: string;
}

export interface IdeaSet {
  theme_concepts: ThemeConcept[];
  decor_suggestions: DecorSuggestion[];
  menu_recommendations: MenuRecommendation[];
  activity_timeline: ActivityItem[];
  budget_hacks: string[];
  source: string;
}

export interface FullPlan {
  request: EventRequest;
  budget: BudgetPlan;
  timeline: TimelinePlan;
  vendors: VendorChecklist;
  ideas: IdeaSet;
}

export interface CategoryShift {
  old_amount: number;
  new_amount: number;
  difference: number;
}

export interface PlanDiff {
  budget_delta: number;
  guest_count_delta: number;
  date_shift_days: number;
  category_shifts: Record<string, CategoryShift>;
  newly_urgent_tasks: string[];
}

export interface SmartAdvice {
  primary_recommendation: string;
  concrete_options: string[];
  trade_offs: string[];
  first_actions_this_week: string[];
}

export interface ReplanRequest {
  original_request: EventRequest;
  new_budget?: number;
  new_guest_count?: number;
  new_event_date?: string;
}

export interface ReplanResponse {
  new_plan: FullPlan;
  diff: PlanDiff;
  advice: SmartAdvice;
}
