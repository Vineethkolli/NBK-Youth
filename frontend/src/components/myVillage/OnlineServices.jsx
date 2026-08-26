import {
  Building2,
  CreditCard,
  FileText,
  Landmark,
  ExternalLink,
  Fingerprint,
  ReceiptText,
} from "lucide-react";

const services = [
  {
    title: "Panchayat Information",
    description:
      "Panchayat profile, elected members, activities, assets information.",
    icon: Building2,
    href: "https://egramswaraj.gov.in/knowYourPanchayat.do",
  },
  {
    title: "Panchayat Information",
    description:
      "Panchayat profile",
    icon: Building2,
    href: "https://swarnapanchayat.apcfss.in/OutsidePanchayatProfileView",
  },
  {
    title: "House & Water Tax",
    description:
      "House tax, water tax, online payments and citizen services.",
    icon: ReceiptText,
    href: "https://swarnapanchayat.apcfss.in/",
  },
  {
    title: "Birth & Death Registration",
    description: "Online birth and death registration services.",
    icon: FileText,
    href: "https://dc.crsorgi.gov.in/crs/",
  },
  {
    title: "Revenue Records",
    description: "View Andhra Pradesh land and revenue records.",
    icon: Landmark,
    href: "https://meebhoomi.ap.gov.in/",
  },
  {
    title: "Aadhaar Services",
    description: "Access Aadhaar related online services.",
    icon: Fingerprint,
    href: "https://myaadhaarbeta.uidai.gov.in/",
  },
  {
    title: "PAN Services",
    description: "PAN application and related services.",
    icon: CreditCard,
    href: "https://www.pan.utiitsl.com/",
  },
];

function ServiceCard({ service }) {
  const Icon = service.icon;

  return (
    <a
      href={service.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Clickable Navigation Icon */}
        <div className="shrink-0 rounded-xl bg-emerald-50 p-3 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
          <Icon size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold text-gray-900">
              {service.title}
            </h3>

            <ExternalLink
              size={16}
              className="shrink-0 text-gray-300 transition group-hover:text-emerald-600"
            />
          </div>

          <p className="mt-1 text-sm leading-5 text-gray-500">
            {service.description}
          </p>
        </div>
      </div>
    </a>
  );
}

export default function OnlineServices() {
  return (
    <section>
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
          <Building2 size={20} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Online Government Services
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Important online services
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.title} service={service} />
        ))}
      </div>
    </section>
  );
}