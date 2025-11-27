import { Activity, CheckCircle, Monitor, Users, Laptop } from "lucide-react";

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 border hover:shadow-md transition">
      <div className="flex items-center mb-4">
        <div className="p-3 rounded-full bg-indigo-100 text-indigo-700">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 ml-3">{title}</h3>
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function AuthSessionStats({ stats }) {
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <SectionCard title="Activity" icon={Activity}>
          <StatRow label="Signins" value={stats.actionCounts?.signin ?? 0} />
          <StatRow label="Signups" value={stats.actionCounts?.signup ?? 0} />
          <StatRow label="Google Signins" value={stats.actionCounts?.["google-signin"] ?? 0} />
          <StatRow label="Google Signups" value={stats.actionCounts?.["google-signup"] ?? 0} />
        </SectionCard>

        <SectionCard title="Sessions" icon={CheckCircle}>
          <StatRow label="Valid" value={stats.validCounts?.validTrue ?? 0} />
          <StatRow label="Invalid" value={stats.validCounts?.validFalse ?? 0} />
        </SectionCard>

        <SectionCard title="Active Users" icon={Users}>
          <StatRow label="Today" value={stats.activeUsers?.today ?? 0} />
          <StatRow label="This Month" value={stats.activeUsers?.month ?? 0} />
          <StatRow label="Overall" value={stats.activeUsers?.overall ?? 0} />
        </SectionCard>

        <SectionCard title="Active Sessions" icon={Laptop}>
          <StatRow label="Today" value={stats.activeSessions?.today ?? 0} />
          <StatRow label="This Month" value={stats.activeSessions?.month ?? 0} />
          <StatRow label="Overall" value={stats.activeSessions?.overall ?? 0} />
        </SectionCard>

        <SectionCard title="Access Modes" icon={Monitor}>
          {Object.entries(stats.accessModeCounts || {}).map(([mode, count]) => (
            <StatRow key={mode} label={mode} value={count} />
          ))}
        </SectionCard>

      </div>
    </div>
  );
}
