import { useState, useRef } from 'react';
import { X, Upload, Send, FileText } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ComposeModal = ({ onClose, onSuccess }: Props) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2000);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseEmails = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return [...new Set(matches)];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emails = parseEmails(text);
      setRecipients(emails);
      if (emails.length > 0) {
        toast.success(`Found ${emails.length} valid email addresses`);
      } else {
        toast.error('No valid email addresses found in file');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) return toast.error('Subject is required');
    if (!body.trim()) return toast.error('Body is required');
    if (recipients.length === 0) return toast.error('At least one recipient is required');
    if (!scheduledTime) return toast.error('Scheduled time is required');

    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) return toast.error('Scheduled time must be in the future');

    setSubmitting(true);
    try {
      const data = await api.emails.schedule({
        subject,
        body,
        recipients,
        scheduledTime: scheduleDate.toISOString(),
        delayBetweenEmails,
        hourlyLimit,
      });
      toast.success(data.message);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule emails');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Compose Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body (HTML supported)"
              rows={5}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Recipients
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-300 hover:border-blue-500 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload CSV/TXT
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {recipients.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">
                  {recipients.length} email{recipients.length !== 1 ? 's' : ''} detected
                </span>
              </div>
            )}
            {recipients.length > 0 && (
              <div className="mt-2 max-h-24 overflow-y-auto bg-gray-800 rounded-lg p-2">
                {recipients.slice(0, 10).map((email, i) => (
                  <span key={i} className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded mr-1 mb-1">
                    {email}
                  </span>
                ))}
                {recipients.length > 10 && (
                  <span className="text-gray-500 text-xs">
                    ...and {recipients.length - 10} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={getMinDateTime()}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Delay Between (ms)
              </label>
              <input
                type="number"
                value={delayBetweenEmails}
                onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                min={500}
                step={500}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Hourly Limit
              </label>
              <input
                type="number"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Number(e.target.value))}
                min={1}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Schedule Emails
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;
