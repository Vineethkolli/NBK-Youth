import React from 'react';

const accessControl = {
  pages: {
    'Home': { full: ['Admin', 'Financier'], view: ['User'] },
    'Committee': { full: ['Admin', 'Financier'], view: ['User'] },
    'Moments': { full: ['Admin', 'Financier'], view: ['User'] },
    'Vibe': { full: ['Admin', 'Financier'], view: ['User'] },
    'Stats': { full: ['Admin', 'Financier'], view: ['User'] },
    'Income': { full: ['Admin','Financier'], view: ['User'] },
    'Expense': { full: ['Financier'], view: ['User', 'Admin'] },
    'Records': { full: [], view: ['User', 'Admin', 'Financier'] },
    'Estimation Stats': { full: ['Admin', 'Financier'], view: ['User'] },
    'Estimation Income': { full: ['Admin', 'Financier'], view: ['Youth'] },
    'Estimation Expense': { full: ['Admin', 'Financier'], view: ['Youth'] },
    'Profile': { full: ['User', 'Admin', 'Financier'], view: [] },
    'PayOnline': { full: ['User', 'Admin', 'Financier'], view: [] },
    'Notifications': { full: ['Admin', 'User', 'Financier'], view: [] },
    'Settings': { full: ['Admin', 'User', 'Financier'], view: [] },
    'Activities': { full: ['Admin', 'Financier'], view: ['User'] },
    'Verification': { full: ['Financier'], view: [] },
    'Users & Roles': { full: [], view: ['Admin','Financier'] },
    'AdminPanel': { full: ['Admin','Financier'], view: [] },
    'RecycleBin': { full: ['Financier'], view: [] },
    'TechStack': { full: [], view: ['User','Admin', 'Financier'] },
    'DeveloperOptions': { full: [], view: [] },
  },
};

const roles = ['User', 'Admin', 'Financier'];

function getPermission(perms, role) {
  if (perms.full.includes(role)) return 'Full';
  if (perms.view.includes(role)) return 'View';
  return null;
}

function permColor(perm) {
  switch (perm) {
    case 'View': return 'text-blue-500';
    case 'Full': return 'text-green-500';
    default: return 'text-gray-400';
  }
}

export default function Access() {
  const pages = Object.keys(accessControl.pages);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
              {roles.map(role => (
                <th
                  key={role}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pages.map(page => {
              const perms = accessControl.pages[page];
              return (
                <tr key={page}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {page}
                  </td>
                  {roles.map(role => {
                    const perm = getPermission(perms, role);
                    return (
                      <td
                        key={role}
                        className={`px-6 py-4 whitespace-nowrap text-center text-sm ${permColor(perm)}`}
                      >
                        {perm || '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 px-4 py-3 bg-green-50 text-green-700 text-center text-sm rounded-md border border-green-200">
        Developer has full access to all pages
      </div>
    </div>
  );
}
