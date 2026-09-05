import { useAuth } from '../context/AuthContext';
import { Access } from '../utils/access';

const page = (title, access, ...points) => ({ title, access, points });

const sections = [
  {
    title: 'General',
    pages: [
      page('Home', 'All: view | Privileged: edit controls',
        'Open Home to see the welcome area, slideshow, and Event Timeline.',
        'Click Edit at the top of Home to show management controls. Click Done when finished.',
        'All users can view Home content. Only Privileged users can change it.'),
      page('Slides', 'All: view | Privileged: add, reorder, delete',
        'Slides are managed inside Home after clicking Edit.',
        'Click Add to select image or video files. You can select up to 15 files at a time.',
        'Click Reorder to drag slides or move them with the up and down arrows. Click Save to apply the new order, or Cancel to discard it.',
        'Click Delete on the selected slide and confirm the warning.',
        'Deleting a slide permanently deletes its related image or video from Cloudinary. This cannot be restored.'),
      page('Event Timeline', 'All: view | Privileged: add, delete',
        'The timeline is displayed inside Home and shows scheduled events.',
        'After clicking Edit on Home, click Add Event.',
        'Enter the Event Name and Date & Time, then click Add.',
        'Use the delete control on an event to remove it after confirmation.'),
      page('Committee', 'All: view | Privileged: add, reorder, delete',
        'View committee members.',
        'Privileged users can add a member by entering the user Register id, then save the entry.',
        'Name and Image are automatically retrieved from the user account.',
        'Use Edit mode to reorder members with drag and drop or the move controls, then save the order.',
        'Remove a member from the committee after confirmation. This does not delete the user account.'),
      page('Moments', 'All: view | Privileged: manage',
        'Browse event moments, open a moment to view its gallery, and play supported media.',
        'Privileged users can add moments from YouTube, uploaded media, Google Drive, or Service Drive when those controls are available.',
        'Edit a moment title, reorder moments, reorder gallery media, copy media to Service Drive, or delete a moment/media item from its action controls.',
        'Confirm the destination and media before deleting or copying files.'),
      page('Vibe', 'All: view | Privileged: manage',
        'Browse music collections and play songs with the music player or floating music button.',
        'Privileged users can create or edit collections and upload up to 15 audio files at a time.',
        'Use collection and song actions to rename, reorder, or delete content. Confirm before deleting because media storage may also be affected.'),
      page('Activities', 'All: view | Privileged: manage',
        'View games or youth activities and their players, scores, and time information.',
        'Privileged users can add a game, edit its name, add or update players, and record time/results.',
        'Delete a game or player only after checking the related results.',
        'Use the English or Telugu print control when a printable activity report is required.'),
      page('Tools', 'All: use',
        'Use the calculator, weather, toss, stopwatch, voice recorder, image-to-PDF, and PDF merger utilities.',
        'Enter the required values, use the tool action, and review the result before relying on it.',
        'Tools are utilities and do not automatically create Income, Expense, or other application records.'),
      page('My Village', 'All: view',
        'Read village information such as facilities, online services, agriculture, and festival details.',
        'Use external links only after checking that the destination is the intended service.',
        'This page is primarily informational; use only the controls displayed for your account.'),
      page('Tech Stack', 'All: view',
        'View the technologies, architecture information, and access matrix used by the application.',
        'Use the available links, share controls, and diagrams as reference material.',
        'This page does not modify application data.'),
      page('Vini assistant', 'All: use after sign-in',
        'Open the floating Vini button from any dashboard page to chat with the application assistant.',
        'Ask a question, review the response, and close the chat to return to the page underneath.',
        'Treat generated answers as assistance. Confirm important financial or operational decisions in the source records.'),
    ],
  },
  {
    title: 'Finance and records',
    pages: [
      page('Stats', 'User: view | Admin, Financier, Developer: full access',
        'Review income, expense, balance, payment, and event summaries.',
        'Use the displayed totals to reconcile records after entering, verifying, restoring, or deleting data.',
        'Privileged users can update previous-year amounts when the page provides that control.',
        'Use the English or Telugu print option for a report.'),
      page('Income', 'User: view | Admin, Financier, Developer: add, edit, delete',
        'Search by income ID, name, or amount. Open Filters for status, payment mode, belongs-to, verification, sorting, and date range.',
        'Open Columns to show or hide fields, then use the English or Telugu print control for the current list.',
        'Privileged users click Add, complete the income form, and save. Use Edit on a row to correct an existing record.',
        'Delete moves the income to the Recycle Bin; it is not immediately permanent.',
        'The global editing lock disables adding and other changes.'),
      page('Expense', 'User, Admin: view | Financier, Developer: add, edit, delete',
        'Search expenses and use Filters for payment mode, verification, sorting, and date range.',
        'Open Columns to show or hide fields such as purpose, amount, payment mode, bill, and verification. Print in English or Telugu.',
        'Pro users click Add, complete the expense form, and save. Use Edit to update an existing expense.',
        'Delete moves the expense to the Recycle Bin. Associated expense bill files are also removed from the configured Cloudinary folder.',
        'The global editing lock disables adding and other changes.'),
      page('Estimation', 'All: view | youth category: estimate entry',
        'Use the Stats tab to compare estimated income, estimated expense, amount paid, amount pending, and balance.',
        'Users in the youth category can open Income or Expense tabs to add and update estimated records.',
        'Refresh or return to Stats after saving so the totals are recalculated.',
        'Use the available English or Telugu print actions for estimation reports.'),
      page('Histories', 'All: view | Developer: add, edit, delete',
        'Review historical income, expense, event, and statistics information.',
        'Use the page tabs, filters, and report controls to find the required historical entry.',
        'Developers can add a history entry, edit it in Edit mode, and delete it after confirmation.',
        'Use history for reference and reconciliation; do not treat it as a replacement for current financial records.'),
      page('Records', 'All: view | Developer: add, edit, delete',
        'Use the tabs to view Overall Stats, Records Timeline, Timeline, and Records.',
        'Select an event name where required, inspect financial records, event records, timeline records, and attached documents.',
        'Developers can add or edit financial, event, and timeline records through the relevant forms.',
        'Delete a record only after confirming its event, year, and related evidence.',
        'Use English or Telugu print controls and document preview/download controls when needed.'),
      page('Pay Online', 'All: use',
        'Review the configured payment recipient and enter the amount and required payment information.',
        'Complete the payment flow and keep the receipt or payment reference.',
        'Payments can appear in the Verification page for Pro users to review.',
        'Confirm the recipient, amount, and reference before completing a payment.'),
    ],
  },
  {
    title: 'Account and communication',
    pages: [
      page('Sign in and Sign up', 'All: sign in | registration depends on configuration',
        'Sign in with your registered account. New users can use Sign up when registration is enabled.',
        'Complete OTP, password, Google, or password-reset steps shown by the authentication flow.',
        'Keep credentials and OTPs private. Contact a Privileged user when an account role must be changed.'),
      page('Profile', 'All: manage own profile',
        'View your name, register ID, contact details, profile image, linked account, and sessions.',
        'Use Edit or the profile form to update permitted details. Email or phone changes may require OTP verification.',
        'Upload or remove the profile image, change the password, link/unlink Google, and sign out from sessions using the displayed controls.',
        'Your register ID and actions are used in audit logs. Do not share an account.'),
      page('Notifications', 'All: view own notifications',
        'Read application, event, payment, and system notifications.',
        'Open a notification to read its full message and use the available read/clear controls.',
        'Notification history is separate from the current notification list.'),
      page('Settings', 'All: manage own settings',
        'Change personal preferences such as application language and notification settings.',
        'Select the required option and save it. Reload the affected page if the change is not immediately visible.',
        'Settings changes affect your account or device; they do not change shared financial records.'),
      page('Maintenance screen', 'Developer: bypass | everyone else: view status',
        'When maintenance mode is enabled, non-developer users see the Scheduled Maintenance screen instead of the dashboard.',
        'The screen may show the expected return time. Wait until maintenance is complete before retrying normal work.'),
    ],
  },
  {
    title: 'Admin tools',
    pages: [
      page('Verification', 'User, Admin: no access | Financier, Developer: review and update',
        'Switch between Income, Expense, and Payment tabs.',
        'Filter by Not Verified, Verified, or Rejected, then inspect each record and its evidence.',
        'Update the verification status and save. Payment records can be edited from the payment table when permitted.',
        'The global editing lock prevents verification changes.'),
      page('Recycle Bin', 'User, Admin: no access | Financier, Developer: restore and permanent delete',
        'Switch between deleted Income and Expense items.',
        'Restore returns an item to its original list after confirmation.',
        'Permanent Delete removes an item forever. Confirm the record and preserve required evidence first.',
        'The global editing lock disables restore and permanent delete.'),
      page('Users & Roles', 'User: no access | Admin, Financier, Developer: manage',
        'Search the user list and switch between Users and Stats.',
        'Use the user action controls to update a user role or category. Confirm the register ID before saving.',
        'Developers may see additional account deletion or administrative controls.',
        'Assign only the access required for the person\'s responsibility and verify the result after saving.'),
      page('Admin Panel', 'User: no access | Admin, Financier, Developer: manage',
        'Manage banners, maintenance mode, event labels, payment details, and scheduled notifications.',
        'Banners can be added with title/message and an image or video, edited, enabled/disabled, or deleted. Only one banner can be enabled at a time; uploads are limited to 90 MB.',
        'Maintenance mode blocks normal users, so enable it only during a controlled maintenance window.',
        'Event labels control labels used by event-related pages. Payment Details controls the recipient shown in payment flows.',
        'Preview notification content, recipients, dates, and schedules before saving or sending.'),
      page('Mailer', 'User: no access | Admin, Financier, Developer: send and review',
        'Compose email messages, select recipients, add supported attachments, and send or schedule mail.',
        'Review Mailer History and scheduled mail entries after creating them.',
        'Check recipients, subject, message, attachments, and schedule carefully because sent messages may not be retractable.'),
    ],
  },
  {
    title: 'Developer zone',
    pages: [
      page('Developer Options', 'Developer only',
        'Backend Health Monitor opens the external uptime status page.',
        'Editing Controls lock or unlock changes on Income, Expense, Verification, and Recycle Bin pages.',
        'Reset Roles changes every non-developer user to the user role. Confirm the impact before using it.',
        'Snapshots can be created, edited, and deleted. Create a snapshot before cleanup or repair.',
        'Processed Data creates a processing definition from a snapshot; Process or Reprocess then generates searchable chunks.',
        'Clear Data permanently clears selected datasets. Activity Logs additionally require entity selection and can be limited by date. These actions cannot be undone.'),
      page('Activity Logs', 'Developer only',
        'Review the audit trail for create, update, delete, verify, restore, and other tracked actions.',
        'Search by register ID, name, description, or entity ID. Filter by action, entity type, user, and date.',
        'Expand a row to inspect the recorded Before and After values.',
        'Switch to Stats for summaries and use the print control for logs or statistics.',
        'Pagination displays up to 50 entries at a time.'),
      page('Auth Sessions', 'Developer only',
        'Review current and historical sign-in sessions.',
        'Search by register ID, name, action, or access mode. Filter by validity, action, sort order, and time period.',
        'Use Columns to show device, location, expiry, and validity fields.',
        'Switch to Stats for session summaries and paginate through the results.',
        'Use this page with Activity Logs to investigate unusual access.'),
      page('Monitor', 'Developer only',
        'Review Service Drive storage and trash, Cloudinary quota and folders, MongoDB cluster and collections, and GitHub Actions workflows and metrics.',
        'Open folders, inspect files, download required items, and return to the parent folder with the navigation controls.',
        'Service Drive actions can move items to trash, permanently delete items, or empty trash. Confirm the selected item before each destructive action.',
        'Use the external Backend Health Monitor status link when checking overall availability.'),
      page('New', 'Developer route, reserved',
        'This route currently displays a Developing screen.',
        'It is not part of the normal operating workflow and currently has no production data-management actions.'),
    ],
  },
];

function AccessList() {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-3">Access definitions</h2>
      <ul className="list-disc list-inside space-y-1 text-gray-700">
        <li><strong>All:</strong> {Access.All.join(', ')}</li>
        <li><strong>Privileged:</strong> {Access.Privileged.join(', ')}</li>
        <li><strong>Pro:</strong> {Access.Pro.join(', ')}</li>
        <li><strong>Developer:</strong> {Access.Developer.join(', ')}</li>
      </ul>
      <p className="mt-3 text-sm text-gray-600">The permission descriptions below use these groups. A page can be visible while its add, edit, delete, or administrative controls remain unavailable.</p>
    </section>
  );
}

function Documentation() {
  const { hasAccess } = useAuth();

  if (!hasAccess('Developer')) {
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;
  }

  return (
    <article className="max-w-4xl mx-auto text-gray-800 leading-7">
      <header className="mb-10 border-b pb-6">
        <h1 className="text-3xl font-semibold">NBK Youth Web Application Documentation</h1>
        <p className="mt-3 text-gray-600">A page-by-page guide for operating and maintaining the application</p>
      </header>

      <AccessList />

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Recommended operating order</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Sign in with your own account and confirm the event label and language.</li>
          <li>Check Home and Stats before entering or correcting data.</li>
          <li>Enter Income or Expense records, attach evidence, and verify the saved list.</li>
          <li>Use Verification, Histories, Records, and Activity Logs to reconcile changes.</li>
          <li>Create a snapshot or backup before maintenance, role changes, cleanup, or repair.</li>
        </ol>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="mb-10">
          <h2 className="text-2xl font-semibold border-b pb-2 mb-6">{section.title}</h2>
          <div className="space-y-8">
            {section.pages.map(({ title, access, points }) => (
              <section key={title}>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-indigo-700"><strong>Access:</strong> {access}</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700">
                  {points.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ))}

      <section className="border-t pt-6 mb-8">
        <h2 className="text-xl font-semibold mb-3">Incident checklist</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Do not clear or permanently delete data while investigating an issue.</li>
          <li>Record the register ID, record ID, time, user, and affected page.</li>
          <li>Check Activity Logs, Auth Sessions, Recycle Bin, and the relevant Stats page.</li>
          <li>Use a snapshot or backup before a repair, then verify totals and the audit log afterward.</li>
        </ul>
      </section>
    </article>
  );
}

export default Documentation;
