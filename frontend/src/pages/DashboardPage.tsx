import { useState, useEffect, useCallback } from 'react';
import type { User, EmailJob } from '../types';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import EmailTable from '../components/EmailTable';
import ComposeModal from '../components/ComposeModal';
import { Plus } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const DashboardPage = ({ user, onLogout }: Props) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<EmailJob[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailJob[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  const fetchScheduled = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const data = await api.emails.getScheduled();
      setScheduledEmails(data.emails);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load scheduled emails');
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  const fetchSent = useCallback(async () => {
    setLoadingSent(true);
    try {
      const data = await api.emails.getSent();
      setSentEmails(data.emails);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sent emails');
    } finally {
      setLoadingSent(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
    fetchSent();
  }, [fetchScheduled, fetchSent]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScheduled();
      fetchSent();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchScheduled, fetchSent]);

  const handleScheduleSuccess = () => {
    setShowCompose(false);
    fetchScheduled();
    fetchSent();
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Scheduled ({scheduledEmails.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sent ({sentEmails.length})
            </button>
          </div>

          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Compose Email
          </button>
        </div>

        {activeTab === 'scheduled' ? (
          <EmailTable
            emails={scheduledEmails}
            loading={loadingScheduled}
            type="scheduled"
          />
        ) : (
          <EmailTable
            emails={sentEmails}
            loading={loadingSent}
            type="sent"
          />
        )}
      </main>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  );
};

export default DashboardPage;
