import { Building2, GraduationCap, HeartPulse, Landmark, Mail, BadgeIndianRupee } from "lucide-react";

const facilities = [
  {
    title: "Sri Valeti Krishnaiah High School",
    subtitle: "High School",
    icon: GraduationCap,
  },
  {
    title: "Public Health Center",
    subtitle: "Healthcare facility",
    icon: HeartPulse,
  },
  {
    title: "Panchayat Office",
    subtitle: "Local administration",
    icon: Landmark,
  },
  {
    title: "Society Office",
    subtitle: "Cooperative bank",
    icon: Building2,
  },
  {
    title: "Post Office",
    subtitle: "Postal services",
    icon: Mail,
  },
  {
    title: "Post Bank",
    subtitle: "Banking services",
    icon: BadgeIndianRupee,
  },
];

export default function VillageFacilities() {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
          <Building2 size={20} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Village Facilities
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Important institutions and facilities
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map(({ title, subtitle, icon: Icon }) => (
          <div
            key={title}
            className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50/50 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl bg-white p-2.5 text-emerald-600 shadow-sm">
                <Icon size={20} />
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold leading-5 text-gray-900">
                  {title}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
