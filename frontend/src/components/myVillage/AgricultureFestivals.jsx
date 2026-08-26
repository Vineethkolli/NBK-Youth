import {
  Wheat,
  Smartphone,
  ExternalLink,
  CalendarDays,
  Store,
} from "lucide-react";

const marketApps = [
  {
    title: "Global Agri Central",
    href: "https://play.google.com/store/apps/details?id=com.globalagricentral",
  },
  {
    title: "NaPanta Farmer App",
    href: "https://play.google.com/store/apps/details?id=com.napanta.farmer.app",
  },
];

const festivals = [
  "Sankranti",
  "Ganesh Chaturthi",
  "Dasara",
  "Diwali",
  "Poleramma Pongal",
  "Moharram",
];

export default function AgricultureFestivals() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Agriculture */}
      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
            <Wheat size={20} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Agriculture & Markets
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Useful agricultural market resources
            </p>
          </div>
        </div>

        {/* Guntur Mirchi Market */}
        <a
          href="https://gunturmirchi.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-gray-100 p-4 transition hover:border-amber-200 hover:bg-amber-50"
        >
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <Store size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">
              Guntur Mirchi Market
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Guntur chilli market information
            </p>
          </div>

          <ExternalLink
            size={16}
            className="text-gray-400 group-hover:text-amber-600"
          />
        </a>

        {/* Market Apps */}
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <Smartphone size={17} className="text-gray-500" />

            <h3 className="text-sm font-semibold text-gray-800">
              Market Price Apps
            </h3>
          </div>

          <div className="space-y-2">
            {marketApps.map((app) => (
              <a
                key={app.href}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm transition hover:bg-amber-50"
              >
                <span className="font-medium text-gray-700">
                  {app.title}
                </span>

                <ExternalLink size={15} className="text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Festivals */}
      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Famous Festivals
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Festivals celebrated
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {festivals.map((festival) => (
            <div
              key={festival}
              className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4 transition hover:bg-rose-50"
            >
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />

              <span className="text-sm font-medium text-gray-700">
                {festival}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}