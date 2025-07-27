import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { Database, Cloud, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DeveloperStorageInfo = () => {
  const [mongo, setMongo] = useState({ loading: true, data: null });
  const [drive, setDrive] = useState({ loading: true, data: null });
  const [cloudinary, setCloudinary] = useState({ loading: true, data: null });

  useEffect(() => {
    // MongoDB
    axios
      .get(`${API_URL}/api/developer/mongodb-storage`)
      .then((res) => setMongo({ loading: false, data: res.data }))
      .catch(() => {
        setMongo({ loading: false, data: null });
        toast.error('Failed to load MongoDB info');
      });

    // Google Drive
    axios
      .get(`${API_URL}/api/developer/drive-stats`)
      .then((res) => setDrive({ loading: false, data: res.data }))
      .catch(() => {
        setDrive({ loading: false, data: null });
        toast.error('Failed to load Drive info');
      });

    // Cloudinary
    axios
      .get(`${API_URL}/api/developer/cloudinary-stats`)
      .then((res) => setCloudinary({ loading: false, data: res.data }))
      .catch(() => {
        setCloudinary({ loading: false, data: null });
        toast.error('Failed to load Cloudinary info');
      });
  }, []);

  const renderCard = (title, Icon, state, renderBody) => (
    <div className="bg-white rounded-lg shadow p-4 w-full max-w-xs">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-6 h-6" />
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {state.loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : state.data ? (
        renderBody(state.data)
      ) : (
        <p className="text-red-500 font-medium">No data available.</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-wrap gap-6">
      {renderCard(
        'MongoDB Storage',
        Database,
        mongo,
        (d) => (
          <ul className="space-y-2 font-medium">
            <li>Storage Size: {d.storageSizeMB} MB</li>
            <li>Collections: {d.collections}</li>
          </ul>
        )
      )}

      {renderCard(
        'Google Drive Storage',
        Cloud,
        drive,
        (d) => (
          <ul className="space-y-2 font-medium">
            <li>Used: {d.usedMB} MB</li>
            <li>Limit: {d.limitMB} MB</li>
          </ul>
        )
      )}

      {renderCard(
        'Cloudinary Storage',
        Server,
        cloudinary,
        (d) => (
          <ul className="space-y-2 font-medium">
            <li>Used: {d.usedMB} MB</li>
            <li>Limit: {d.limitMB} MB</li>
          </ul>
        )
      )}
    </div>
  );
};

export default DeveloperStorageInfo;
