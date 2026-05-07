import type { EmailJob } from '../types';
import { Clock, CheckCircle, XCircle, Loader2, Inbox } from 'lucide-react';

interface Props {
  emails: EmailJob[];
  loading: boolean;
  type: 'scheduled' | 'sent';
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    scheduled: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    queued: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    sent: 'bg-green-500/10 text-green-400 border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const icons: Record<string, React.ReactNode> = {
    scheduled: <Clock className="w-3 h-3" />,
    queued: <Loader2 className="w-3 h-3 animate-spin" />,
    sent: <CheckCircle className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${styles[status] || styles.scheduled}`}>
      {icons[status]}
      {status}
    </span>
  );
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const EmailTable = ({ emails, loading, type }: Props) => {
  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-gray-400 text-sm">Loading emails...</p>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 flex flex-col items-center justify-center">
        <Inbox className="w-12 h-12 text-gray-600 mb-3" />
        <p className="text-gray-400 text-sm">
          {type === 'scheduled' ? 'No scheduled emails yet' : 'No sent emails yet'}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          {type === 'scheduled'
            ? 'Click "Compose Email" to schedule your first email'
            : 'Scheduled emails will appear here after being sent'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                Recipient
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                Subject
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                {type === 'scheduled' ? 'Scheduled Time' : 'Sent Time'}
              </th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {emails.map((email) => (
              <tr key={email.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 text-sm text-white whitespace-nowrap">
                  {email.recipientEmail}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                  {email.subject}
                </td>
                <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                  {type === 'sent' && email.sentTime
                    ? formatDate(email.sentTime)
                    : formatDate(email.scheduledTime)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={email.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmailTable;
