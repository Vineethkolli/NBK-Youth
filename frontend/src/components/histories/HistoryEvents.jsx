import { formatDateTime } from '../../utils/dateTime';

function HistoryEvents({ events, snapshotName }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No events data available for {snapshotName}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{snapshotName} - Events Timeline</h2>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events scheduled</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            {events.map((event, index) => (
              <div key={event._id || index} className="relative pl-8 pb-8">
                <div className="absolute left-2 top-2 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white" />
                <div className="bg-white rounded-lg shadow p-4">
                  <div>
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-sm text-gray-500">
                      {event.dateTime ? formatDateTime(event.dateTime) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryEvents;