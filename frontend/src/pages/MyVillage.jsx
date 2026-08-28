import {House, MapPin, Users, LandPlot, UserRound, Mail, UsersRound, Landmark, Church, Mosque, MapPinned } from "lucide-react";
import OnlineServices from "../components/myVillage/OnlineServices";
import VillageFacilities from "../components/myVillage/VillageFacilities";
import AgricultureFestivals from "../components/myVillage/AgricultureFestivals";

const stats = [
  {
    label: "Population",
    value: "2,949",
    note: "Census 2011",
    icon: Users,
  },
  {
    label: "Households",
    value: "848",
    note: "Census 2011",
    icon: House,
  },
  {
    label: "Village Area",
    value: "374 ha",
    note: "Geographical area",
    icon: LandPlot,
  },
  {
    label: "PIN Code",
    value: "523167",
    note: "Gangavaram B.O",
    icon: MapPin,
  },
];

const temples = [
  "Hanuman Statue",
  "Bodraii",
  "Shivalayam",
  "Ganesh Temple",
  "Lord Venkateswara",
  "Ramalayam",
  "Poleramma Thalli",
  "Malluchamma Ammavaru",
  "Reddys Devara",
  "Brahmam Gari Temple",
  "Mosque",
  "Church",
];

const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=Gangavaram%2C%20Inkollu%2C%20Andhra%20Pradesh%20523167";

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
        <Icon size={20} />
      </div>

      <div className="min-w-0">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-4 rounded-xl bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>

      <span className="text-right text-sm font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

function PopulationCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-emerald-700">{label}</p>

        {Icon && (
          <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm">
            <Icon size={16} />
          </div>
        )}
      </div>

      <p className="mt-3 text-2xl font-bold text-emerald-950">{value}</p>
    </div>
  );
}

function SmallStat({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>

        <p className="mt-0.5 font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function MyVillage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-green-700 to-teal-700">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-white/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
    
    <div>
      <div className="mt-2 flex items-center gap-3">
        <p className="text-4xl font-bold text-emerald-100">
          Gangavaram
        </p>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Gangavaram in Google Maps"
          title="Open in Google Maps"
          className="inline-flex rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:scale-110 hover:bg-white/20"
        >
          <MapPinned size={20} />
        </a>
      </div>

      <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50 sm:text-base">
        A peaceful village rooted in tradition, surrounded by nature and
        united by the warmth of its people. Here, generations grow together,
        traditions live on, festivals bring hearts closer, and every corner
        carries a story.
      </p>
    </div>

    <div className="w-full rounded-3xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur sm:p-6 md:w-auto md:min-w-[220px]">
      <House size={42} strokeWidth={1.5} />

      <p className="mt-4 text-sm text-emerald-100">
        Our People • Our Land
      </p>

      <p className="font-semibold">
        Our Future
      </p>
    </div>

  </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, note, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <Icon size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs font-medium text-gray-500">
                {label}
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
                {value}
              </p>

              <p className="mt-1 text-[11px] text-gray-400">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={House}
              title="Village Overview"
              description="Basic information"
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Village" value="Gangavaram" />
              <InfoRow label="Mandal" value="Inkollu" />
              <InfoRow label="District" value="Bapatla" />
              <InfoRow label="PIN Code" value="523167" />
              <InfoRow label="Village Code" value="590740" />
              <InfoRow label="Geographical Area" value="374 hectares" />
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle
              icon={Users}
              title="Population & Demographics"
              description="Gender, social category and community-wise population"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <PopulationCard
                label="Total Population"
                value="2,949"
              />

              <PopulationCard
                label="Male Population"
                value="1,489"
              />

              <PopulationCard
                label="Female Population"
                value="1,460"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoRow label="Households" value="848" />
              <InfoRow label="Children (0–6)" value="248" />
              <InfoRow label="Female / 1000 Male" value="980" />
            </div>

            <div className="mt-6 pt-6">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Social Category
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SmallStat
                  label="General Population"
                  value="1,060"
                  icon={Users}
                />

                <SmallStat
                  label="OBC Population"
                  value="1,000"
                  icon={Users}
                />

                <SmallStat
                  label="SC Population"
                  value="489"
                  icon={Users}
                />

                <SmallStat
                  label="ST Population"
                  value="400"
                  icon={Users}
                />
              </div>
            </div>

            {/* Religion */}
            <div className="mt-6 pt-6">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Community-wise Population
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <SmallStat label="Hindus" value="2,102" icon={Users} />
                <SmallStat label="Muslims" value="252" icon={Users} />
                <SmallStat label="Christians" value="595" icon={Users} />
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <SectionTitle
                icon={UsersRound}
                title="Youth Clubs"
                description="Active youth organizations"
              />

              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div>
                  <p className="text-xs font-medium text-emerald-700">
                    Total Youth Clubs
                  </p>

                  <p className="mt-1 text-3xl font-bold text-emerald-950">
                    8
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
                  <UsersRound size={28} strokeWidth={1.7} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <SectionTitle
                icon={UserRound}
                title="Panchayat Secretary"
                description="Contact details"
              />

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Secretary
                </p>

                <p className="mt-1 text-lg font-bold text-gray-900">
                  KURAPATI BALAJI
                </p>

                <a
                  href="mailto:gangavaramsecretariat@gmail.com"
                  className="mt-3 flex items-start gap-2 text-sm font-medium text-emerald-600 transition hover:text-emerald-700 hover:underline"
                >
                  <Mail className="mt-0.5 shrink-0" size={16} />

                  <span className="break-all">
                    gangavaramsecretariat@gmail.com
                  </span>
                </a>
              </div>
            </div>
          </section>

          <OnlineServices />

          <VillageFacilities />

<section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
  <SectionTitle
    icon={Landmark}
    title="Temples & Places of Worship"
    description="Religious places in our village"
  />

  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {temples.map((place) => {
      const isMosque = place === "Mosque";
      const isChurch = place === "Church";

      const Icon = isMosque
        ? Mosque
        : isChurch
          ? Church
          : Landmark;

      return (
        <div
          key={place}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:border-emerald-100 hover:bg-emerald-50/50"
        >
          <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <Icon size={18} />
          </div>

          <p className="text-sm font-semibold text-gray-800">
            {place}
          </p>
        </div>
      );
    })}
  </div>
</section>

          <AgricultureFestivals />
        </div>
      </main>

      <footer className="text-center text-sm text-gray-500">
       Population and demographic figures are based on Census 2011
    </footer>
    </div>
  );
}
