function PeopleStats({ people, streets, PrintComponent }) {
  const stats = {
    total: people.length,
    youth: people.filter((person) => person.category === 'Youth').length,
    villagers: people.filter((person) => person.category === 'Villager').length
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">People Statistics</h2>
        {PrintComponent && <PrintComponent people={people} streets={streets} />}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ['People count', stats.total, 'text-indigo-600'],
          ['Youth count', stats.youth, 'text-amber-600'],
          ['Villagers count', stats.villagers, 'text-green-600']
        ].map(([label, count, color]) => (
          <div key={label} className="rounded-lg bg-white p-4 shadow">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${color}`}>{count}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Street wise people</h2>
        <div className="divide-y divide-gray-100">
          {streets.map((street) => (
            <div key={street} className="flex items-center justify-between py-3 text-sm">
              <span>{street}</span>
              <span className="font-semibold text-gray-700">
                {people.filter((person) => person.street === street).length}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PeopleStats;
