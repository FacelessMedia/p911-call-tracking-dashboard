import Papa from "papaparse";

export interface ContactRecord {
  contactId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  businessName: string;
  created: string;
  lastActivity: string;
  tags: string[];
}

export interface MonthlyData {
  month: string; // e.g. "2024-04"
  label: string; // e.g. "Apr 2024"
  count: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface DashboardData {
  records: ContactRecord[];
  monthlyData: MonthlyData[];
  tagCounts: TagCount[];
  totalContacts: number;
  dateRange: { start: string; end: string };
  avgPerMonth: number;
  topLocations: TagCount[];
  contactTypes: { name: string; value: number }[];
}

const LOCATION_TAGS_TO_EXCLUDE = new Set([
  "name via lookup",
  "couldn't find caller name",
  "phone call",
  "chat bot messages",
  "form fill out",
  "validated",
  "solicitation",
  "spam likely",
  "long wait no answer",
  "no answer",
  "disregard",
  "zilla",
  "chicago form",
  "plumbers 911 volo",
]);

function isLocationTag(tag: string): boolean {
  return !LOCATION_TAGS_TO_EXCLUDE.has(tag.toLowerCase().trim());
}

export async function fetchAndParseCSV(): Promise<DashboardData> {
  const response = await fetch("/data.csv");
  const csvText = await response.text();

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const records: ContactRecord[] = (parsed.data as Record<string, string>[]).map((row) => ({
    contactId: row["Contact Id"] || "",
    firstName: row["First Name"] || "",
    lastName: row["Last Name"] || "",
    phone: row["Phone"] || "",
    email: row["Email"] || "",
    businessName: row["Business Name"] || "",
    created: row["Created"] || "",
    lastActivity: row["Last Activity"] || "",
    tags: row["Tags"]
      ? row["Tags"]
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
  }));

  // Monthly counts
  const monthMap = new Map<string, number>();
  records.forEach((r) => {
    if (!r.created) return;
    const date = new Date(r.created);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const sortedMonths = Array.from(monthMap.keys()).sort();
  const monthlyData: MonthlyData[] = sortedMonths.map((key) => {
    const [year, month] = key.split("-");
    return {
      month: key,
      label: `${monthNames[parseInt(month) - 1]} ${year}`,
      count: monthMap.get(key) || 0,
    };
  });

  // Tag counts (all tags)
  const tagMap = new Map<string, number>();
  records.forEach((r) => {
    r.tags.forEach((tag) => {
      const normalized = tag.toLowerCase().trim();
      if (!normalized) return;
      tagMap.set(normalized, (tagMap.get(normalized) || 0) + 1);
    });
  });

  const tagCounts: TagCount[] = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  // Location tags only
  const locationMap = new Map<string, number>();
  records.forEach((r) => {
    r.tags.forEach((tag) => {
      const normalized = tag.toLowerCase().trim();
      if (!normalized || !isLocationTag(normalized)) return;
      locationMap.set(normalized, (locationMap.get(normalized) || 0) + 1);
    });
  });

  const topLocations: TagCount[] = Array.from(locationMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  // Contact type breakdown
  const phoneCallCount = records.filter((r) => r.phone && !r.tags.includes("chat bot messages") && !r.tags.includes("form fill out")).length;
  const chatBotCount = records.filter((r) => r.tags.includes("chat bot messages")).length;
  const formCount = records.filter((r) => r.tags.includes("form fill out")).length;
  const otherCount = records.length - phoneCallCount - chatBotCount - formCount;

  const contactTypes = [
    { name: "Phone Calls", value: phoneCallCount },
    { name: "Chat Bot", value: chatBotCount },
    { name: "Form Submissions", value: formCount },
  ];
  if (otherCount > 0) {
    contactTypes.push({ name: "Other", value: otherCount });
  }

  // Date range
  const dates = records.filter((r) => r.created).map((r) => new Date(r.created));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const avgPerMonth = monthlyData.length > 0 ? Math.round(records.length / monthlyData.length) : 0;

  return {
    records,
    monthlyData,
    tagCounts,
    totalContacts: records.length,
    dateRange: {
      start: minDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      end: maxDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    },
    avgPerMonth,
    topLocations,
    contactTypes,
  };
}
