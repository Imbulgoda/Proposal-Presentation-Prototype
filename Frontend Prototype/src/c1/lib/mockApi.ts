import authMe from "../mock/auth-me.json";
import dashboard from "../mock/dashboard.json";
import children from "../mock/children.json";
import notifications from "../mock/notifications.json";
import alerts from "../mock/alerts.json";
import modelDisplay from "../mock/model-display.json";

import childC1042 from "../mock/child-C-1042.json";
import childC1023 from "../mock/child-C-1023.json";
import childC1002 from "../mock/child-C-1002.json";
import childC1016 from "../mock/child-C-1016.json";
import childC1005 from "../mock/child-C-1005.json";
import childC1011 from "../mock/child-C-1011.json";
import childC1014 from "../mock/child-C-1014.json";
import childC1004 from "../mock/child-C-1004.json";
import childC1001 from "../mock/child-C-1001.json";
import childC1003 from "../mock/child-C-1003.json";
import childC1015 from "../mock/child-C-1015.json";
import childC1017 from "../mock/child-C-1017.json";

const CHILD_BY_ID: Record<string, unknown> = {
  "42a351c2-911d-4066-9b3c-9dfb318e4d4d": childC1042,
  "c6c9cb4e-4009-47ef-b9c0-c20eeae219ba": childC1023,
  "7f7e338e-a3d3-4946-b195-2fe2759a829d": childC1002,
  "f8e707f0-a799-4b9b-8daa-013abe2d1480": childC1016,
  "c7e46b3e-8ba4-4c43-84e1-f04ff1cff5ff": childC1005,
  "33092a3c-a14a-4b10-a45c-207d23b1a2bf": childC1011,
  "5e97a510-f09f-48c4-a118-bf0671aea4cc": childC1014,
  "01e92f92-1887-40bf-af5b-5325e402a503": childC1004,
  "90e61f12-7179-48f4-8eb7-24cf8adc5953": childC1001,
  "cac56af1-34de-47c0-8493-1042713b6ab7": childC1003,
  "411da26c-ecb5-48d5-9c72-063738a5b5bb": childC1015,
  "a6770f3e-c36e-4b6f-8022-26113249227f": childC1017,
};

const INTEGRATIONS_STATUS = {
  integration_mode: "mock",
  c2: { status: "NOT_CONFIGURED", configured: false },
  c3: { status: "NOT_CONFIGURED", configured: false, pending_events: 0, failed_events: 0 },
  c4: { status: "NOT_CONFIGURED", configured: false, pending_events: 0, failed_events: 0 },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parsePath(path: string) {
  const [pathname, query = ""] = path.split("?");
  return { pathname, params: new URLSearchParams(query) };
}

function buildVisitPrefill(profile: Record<string, unknown>) {
  const current = profile.current as Record<string, unknown> | undefined;
  const lastVisitNumber = current ? Number(current.visit_number) : 0;
  const isBaseline = lastVisitNumber === 0;
  const latestInputs = (profile.latest_inputs ?? {}) as Record<string, Record<string, unknown> | null | undefined>;
  const measurements = (current?.measurements ?? {}) as Record<string, unknown>;

  const anthropometric =
    latestInputs.anthropometric ??
    (lastVisitNumber > 0
      ? {
          age_months: profile.age_months,
          sex: profile.sex,
          height_cm: measurements.height_cm,
          weight_kg: measurements.weight_kg,
          muac_cm: measurements.muac_cm,
        }
      : null);

  return {
    child: {
      id: profile.id,
      pseudonymous_id: profile.pseudonymous_id,
      study_serial_number: null,
      full_name: profile.full_name ?? null,
      sex: profile.sex,
      date_of_birth: profile.date_of_birth,
      age_months: profile.age_months,
      visit_count: lastVisitNumber,
      is_baseline: isBaseline,
      visit_label: isBaseline ? "V1" : `V${lastVisitNumber + 1}`,
    },
    last_visit_id: current?.id ?? null,
    anthropometric,
    socioeconomic: latestInputs.socioeconomic ?? null,
    dietary: latestInputs.dietary ?? null,
    maternal_child_health: latestInputs.maternal_child_health ?? null,
  };
}

export async function mockApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const { pathname } = parsePath(path);

  if (method === "POST" && pathname === "/auth/login") {
    return {
      user: authMe,
      csrf_token: "demo-csrf-token",
      disclaimer: "Synthetic Demonstration Data. Not for clinical use.",
    } as T;
  }
  if (method === "POST" && (pathname === "/auth/logout" || pathname === "/auth/refresh")) {
    if (pathname === "/auth/refresh") {
      return { user: authMe, csrf_token: "demo-csrf-token" } as T;
    }
    return undefined as T;
  }

  if (method === "GET") {
    if (pathname === "/auth/me") return clone(authMe) as T;
    if (pathname === "/dashboard") return clone(dashboard) as T;
    if (pathname === "/notifications") return clone(notifications) as T;
    if (pathname === "/alerts") return clone(alerts) as T;
    if (pathname === "/integrations/status") return clone(INTEGRATIONS_STATUS) as T;
    if (pathname === "/runtime/model-display") return clone(modelDisplay) as T;
    if (pathname === "/children") return clone(children) as T;
    if (pathname === "/follow-ups") {
      return {
        items: (dashboard as { follow_ups?: { overdue: unknown[]; today: unknown[]; upcoming: unknown[] } }).follow_ups
          ? [
              ...((dashboard as { follow_ups: { overdue: unknown[] } }).follow_ups.overdue ?? []),
              ...((dashboard as { follow_ups: { today: unknown[] } }).follow_ups.today ?? []),
              ...((dashboard as { follow_ups: { upcoming: unknown[] } }).follow_ups.upcoming ?? []),
            ]
          : [],
      } as T;
    }
    if (pathname.endsWith("/registration-options")) {
      return {
        facility: {
          id: (authMe as { facility_id?: string }).facility_id ?? "a37f1273-c0db-497f-8bf5-169bf17f15da",
          name: (authMe as { facility_name?: string }).facility_name ?? "Colombo Child Health Clinic",
          code: (authMe as { facility_code?: string }).facility_code ?? "CCHC-04",
          district: "Colombo",
        },
        care_teams: [
          "Paediatric Clinic",
          "Nutrition Clinic",
          "Child Health Clinic",
          "Community Nutrition Unit",
        ],
        caregiver_relationships: ["Mother", "Father", "Guardian", "Other"],
        districts: ["Colombo", "Gampaha", "Kalutara", "Kandy", "Galle", "Matara"],
        moh_areas: ["Colombo MOH-01", "Colombo MOH-02", "Colombo MOH-03"],
        doctors: [
          {
            id: (authMe as { id?: string }).id ?? "5b0aa5a7-33dc-42ec-804e-5c72b5fbe575",
            full_name: (authMe as { full_name?: string }).full_name ?? "Dr. Sandun Jayawardena",
            email: (authMe as { email?: string }).email ?? "doctor@gmail.com",
          },
        ],
        current_user_id: (authMe as { id?: string }).id ?? "5b0aa5a7-33dc-42ec-804e-5c72b5fbe575",
      } as T;
    }
    if (pathname.endsWith("/prefill")) {
      const childId = pathname.split("/")[2];
      const profile = CHILD_BY_ID[childId] as Record<string, unknown> | undefined;
      if (!profile) throw new Error("Child not found");
      return clone(buildVisitPrefill(profile)) as T;
    }
    if (pathname.endsWith("/report")) {
      const childId = pathname.split("/")[2];
      const profile = CHILD_BY_ID[childId];
      return { child: profile, visits: (profile as { visits?: unknown[] })?.visits ?? [] } as T;
    }
    if (pathname.endsWith("/c3-reassessment")) {
      return { status: "NOT_CONFIGURED", message: "Intervention reassessment component not connected." } as T;
    }
    if (pathname.includes("/prediction/explanation")) {
      return {
        summary: "Demo explanation based on visit inputs and model assessment.",
        factors: [],
      } as T;
    }
    const childProfileMatch = pathname.match(/^\/children\/([^/]+)$/);
    if (childProfileMatch && CHILD_BY_ID[childProfileMatch[1]]) {
      return clone(CHILD_BY_ID[childProfileMatch[1]]) as T;
    }
    if (pathname === "/admin/users") return { items: [authMe] } as T;
    if (pathname === "/admin/security") return { active_users: 1, failed_logins: [], recent_audit: [] } as T;
    if (pathname === "/admin/settings") return { policy: {} } as T;
    if (pathname === "/admin/system") return { integrations: INTEGRATIONS_STATUS, workers: [] } as T;
    if (pathname === "/research/dataset-profile") return { fields: [], modalities: [] } as T;
    if (pathname === "/research/ablation") return { items: [] } as T;
    if (pathname === "/models") return { items: [{ model_key: "MCA", version: "2026-001", is_demo: true }] } as T;
    if (pathname === "/research/model-comparison") return { items: [] } as T;
  }

  if (method === "POST" && pathname === "/children") {
    return {
      id: "demo-new-child-id",
      pseudonymous_id: "C-NEW",
      message: "Child registered (Synthetic Demonstration Data).",
    } as T;
  }

  if (["POST", "PATCH", "PUT"].includes(method)) {
    return { ok: true } as T;
  }

  throw new Error(`Mock API route not implemented: ${method} ${pathname}`);
}
