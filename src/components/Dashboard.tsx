"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Phone, MessageSquare, FileText, TrendingUp, Calendar, Hash, MapPin, Loader2 } from "lucide-react";
import { fetchAndParseCSV, DashboardData, TagCount } from "@/lib/parse-data";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#94a3b8"];

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function TagBadge({ tag, count, max }: { tag: string; count: number; max: number }) {
  const width = Math.max((count / max) * 100, 8);
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-sm text-slate-600 w-40 truncate capitalize font-medium" title={tag}>
        {tag}
      </span>
      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
          style={{ width: `${width}%` }}
        >
          {width > 15 && <span className="text-xs font-semibold text-white">{count}</span>}
        </div>
      </div>
      {width <= 15 && <span className="text-xs font-semibold text-slate-500 w-8">{count}</span>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-lg font-bold text-blue-600">{payload[0].value} contacts</p>
      </div>
    );
  }
  return null;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<"all" | "locations" | "status">("all");
  const [tagSearch, setTagSearch] = useState("");

  useEffect(() => {
    fetchAndParseCSV()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading call data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-medium">Failed to load data.</p>
      </div>
    );
  }

  const STATUS_TAGS = new Set([
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

  let filteredTags: TagCount[] = data.tagCounts;
  if (tagFilter === "locations") {
    filteredTags = data.tagCounts.filter((t) => !STATUS_TAGS.has(t.tag));
  } else if (tagFilter === "status") {
    filteredTags = data.tagCounts.filter((t) => STATUS_TAGS.has(t.tag));
  }

  if (tagSearch) {
    filteredTags = filteredTags.filter((t) => t.tag.includes(tagSearch.toLowerCase()));
  }

  const displayTags = filteredTags.slice(0, 30);
  const maxTagCount = displayTags.length > 0 ? displayTags[0].count : 1;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">P911 Call Tracking Dashboard</h1>
              <p className="text-sm text-slate-500">
                {data.dateRange.start} &ndash; {data.dateRange.end}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Phone className="w-5 h-5" />}
            label="Total Contacts"
            value={data.totalContacts.toLocaleString()}
            sub={`${data.dateRange.start} – ${data.dateRange.end}`}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Avg / Month"
            value={data.avgPerMonth}
            sub={`Across ${data.monthlyData.length} months`}
          />
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="Unique Locations"
            value={data.topLocations.length + "+"}
            sub="Cities/areas tagged"
          />
          <StatCard
            icon={<Hash className="w-5 h-5" />}
            label="Unique Tags"
            value={data.tagCounts.length}
            sub="Total distinct tags"
          />
        </div>

        {/* Monthly Call Volume Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Monthly Call Volume</h2>
          <p className="text-sm text-slate-500 mb-6">Number of new contacts created each month</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  interval={1}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two column: Pie + Top Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Type Pie */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Contact Types</h2>
            <p className="text-sm text-slate-500 mb-6">Breakdown by source type</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.contactTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.contactTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Locations Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Top 15 Locations</h2>
            <p className="text-sm text-slate-500 mb-6">Most frequently tagged cities/areas</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topLocations.slice(0, 15)} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="tag"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    style={{ textTransform: "capitalize" }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Full Tag Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tag Breakdown</h2>
              <p className="text-sm text-slate-500">All tags with frequency counts</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                {(["all", "locations", "status"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTagFilter(f)}
                    className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${
                      tagFilter === f ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {displayTags.map((t) => (
              <TagBadge key={t.tag} tag={t.tag} count={t.count} max={maxTagCount} />
            ))}
            {displayTags.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No tags match your filter.</p>
            )}
          </div>
          {filteredTags.length > 30 && (
            <p className="text-xs text-slate-400 mt-4 text-center">
              Showing top 30 of {filteredTags.length} tags
            </p>
          )}
        </div>

        {/* Monthly Detail Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Monthly Detail</h2>
          <p className="text-sm text-slate-500 mb-6">Exact counts per month</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Contacts</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Volume</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyData.map((m) => {
                  const maxMonthly = Math.max(...data.monthlyData.map((d) => d.count));
                  const barW = (m.count / maxMonthly) * 100;
                  return (
                    <tr key={m.month} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-700">{m.label}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">{m.count}</td>
                      <td className="py-3 px-4 w-1/2">
                        <div className="bg-slate-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400">
          P911 Call Tracking Dashboard &middot; Data exported Mar 23, 2026
        </div>
      </footer>
    </div>
  );
}
