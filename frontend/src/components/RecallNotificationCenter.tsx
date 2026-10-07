import { useState } from 'react';
import type { InvestigationResponse } from '../api/types';

interface Props {
  result: InvestigationResponse | null;
}

export const RecallNotificationCenter: React.FC<Props> = ({ result }) => {
  const [messageTemplate, setMessageTemplate] = useState('auto');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [notificationResult, setNotificationResult] = useState<string | null>(null);

  if (!result || !result.batch || result.batch.status !== 'CONTAMINATED') {
    return null;
  }

  const affectedCustomers = result.customers?.length || 0;
  const affectedKitchens = result.kitchens?.length || 0;
  const affectedOrders = result.orders?.length || 0;

  const generateAutoMessage = () => {
    const batchId = result.batch?.id;
    const ingredient = result.batch?.ingredient;
    return `🚨 URGENT FOOD SAFETY RECALL 🚨

Batch ID: ${batchId}
Ingredient: ${ingredient}
Status: CONTAMINATED

This batch has been identified as contaminated and has been immediately recalled from all locations.

Affected Entities:
� ${affectedKitchens} Kitchen(s)
� ${affectedOrders} Order(s)
� ${affectedCustomers} Customer(s)

Actions Taken:
? Batch marked as CONTAMINATED
? All inventory quarantined
? Production halted
? Investigation initiated

Customer Safety Instructions:
If you have received any product from this batch, please:
1. DO NOT CONSUME the product
2. Return or dispose of the product immediately
3. Contact us at support@infometrace.com
4. Monitor for any symptoms

We sincerely apologize for any inconvenience and are taking all necessary steps to ensure this does not happen again.

For questions, contact: recall-team@infometrace.com
Reference: RECALL-${batchId}-${new Date().toISOString().split('T')[0]}`;
  };

  const handleSendNotifications = async () => {
    setNotificationStatus('sending');
    setNotificationResult(null);

    const messageToSend = messageTemplate === 'auto' ? generateAutoMessage() : customMessage;

    try {
      const promises = [];
      let successCount = 0;
      let failCount = 0;

      // Send to all customers
      if (result.customers && result.customers.length > 0) {
        for (const customer of result.customers) {
          try {
            const response = await fetch('http://127.0.0.1:8000/api/recall/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batch_id: result.batch!.id,
                action_type: 'CUSTOMER_NOTIFICATION',
                customer_id: customer.id,
                performed_by: 'QA_TEAM',
                notification_method: 'Email + SMS',
                notification_content: messageToSend,
                notes: `Recall notification for customer: ${customer.name}`
              })
            });
            
            if (response.ok) {
              successCount++;
              console.log(`? Sent notification to customer ${customer.id}`);
            } else {
              failCount++;
              console.error(`? Failed to send to customer ${customer.id}:`, await response.text());
            }
          } catch (err) {
            failCount++;
            console.error(`? Error sending to customer ${customer.id}:`, err);
          }
        }
      }

      // Send to all kitchens (using notes field for kitchen notification)
      if (result.kitchens && result.kitchens.length > 0) {
        for (const kitchen of result.kitchens) {
          try {
            // Create a simple recall action for kitchen with batch association
            const response = await fetch('http://127.0.0.1:8000/api/recall/action', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batch_id: result.batch!.id,
                action_type: 'VERIFICATION_TEST',
                test_type: 'Kitchen Notification',
                test_lab: kitchen.name,
                performed_by: 'QA_TEAM',
                notes: `KITCHEN RECALL NOTIFICATION: ${kitchen.name} (${kitchen.id}) - ${messageToSend.substring(0, 200)}...`
              })
            });
            
            if (response.ok) {
              successCount++;
              console.log(`? Sent notification to kitchen ${kitchen.id}`);
            } else {
              failCount++;
              console.error(`? Failed to send to kitchen ${kitchen.id}:`, await response.text());
            }
          } catch (err) {
            failCount++;
            console.error(`? Error sending to kitchen ${kitchen.id}:`, err);
          }
        }
      }

      const totalCount = (result.customers?.length || 0) + (result.kitchens?.length || 0);

      if (failCount === 0) {
        setNotificationStatus('success');
        setNotificationResult(`? Successfully sent ${successCount} notification(s) to all affected parties (${result.customers?.length || 0} customers, ${result.kitchens?.length || 0} kitchens)`);
      } else {
        setNotificationStatus('error');
        setNotificationResult(`? Sent ${successCount}/${totalCount} notifications. ${failCount} failed.`);
      }
    } catch (error: any) {
      setNotificationStatus('error');
      setNotificationResult(`? Failed to send notifications: ${error.message}`);
    }
  };

  const previewMessage = messageTemplate === 'auto' ? generateAutoMessage() : customMessage;

  return (
    <section className="bg-surface border-2 border-ui-border p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-ui-border">
        <div className="w-3 h-3 rounded-full bg-critical animate-pulse"></div>
        <h2 className="text-sm font-bold text-ink tracking-widest uppercase">
          📢 Recall Notification Center
        </h2>
      </div>

      {/* Affected Entities Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-canvas border border-ui-border p-4">
          <div className="text-2xl font-bold font-mono text-ink mb-1">{affectedCustomers.toString().padStart(2, '0')}</div>
          <div className="text-[9px] font-bold text-muted uppercase tracking-widest">Customers</div>
        </div>
        <div className="bg-canvas border border-ui-border p-4">
          <div className="text-2xl font-bold font-mono text-ink mb-1">{affectedKitchens.toString().padStart(2, '0')}</div>
          <div className="text-[9px] font-bold text-muted uppercase tracking-widest">Kitchens</div>
        </div>
        <div className="bg-canvas border border-ui-border p-4">
          <div className="text-2xl font-bold font-mono text-ink mb-1">{affectedOrders.toString().padStart(2, '0')}</div>
          <div className="text-[9px] font-bold text-muted uppercase tracking-widest">Orders</div>
        </div>
      </div>

      {/* Message Template Selector */}
      <div className="mb-6">
        <label className="block text-[11px] font-bold text-ink uppercase tracking-widest mb-3">
          Message Template
        </label>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setMessageTemplate('auto')}
            className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
              messageTemplate === 'auto'
                ? 'bg-accent text-white border-2 border-accent'
                : 'bg-surface text-ink border-2 border-ui-border hover:border-accent'
            }`}
          >
            🤖 Auto-Generated
          </button>
          <button
            onClick={() => setMessageTemplate('custom')}
            className={`flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
              messageTemplate === 'custom'
                ? 'bg-accent text-white border-2 border-accent'
                : 'bg-surface text-ink border-2 border-ui-border hover:border-accent'
            }`}
          >
            ✏️ Custom Message
          </button>
        </div>

        {messageTemplate === 'custom' && (
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter custom recall message..."
            className="w-full h-32 bg-surface border-2 border-ui-border px-4 py-3 text-sm text-ink font-mono focus:outline-none focus:border-accent resize-none"
          />
        )}
      </div>

      {/* Message Preview */}
      <div className="mb-6 bg-canvas border-2 border-ui-border p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-accent"></div>
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest">Message Preview</h3>
        </div>
        <pre className="text-[10px] text-ink font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
          {previewMessage || 'No message to preview'}
        </pre>
      </div>

      {/* Send Notifications Button */}
      <button
        onClick={handleSendNotifications}
        disabled={notificationStatus === 'sending' || (!customMessage && messageTemplate === 'custom')}
        className="w-full bg-critical hover:bg-maroon disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 font-bold tracking-widest uppercase text-sm transition-all border-2 border-transparent hover:border-white disabled:hover:border-transparent shadow-lg hover:shadow-xl mb-4"
      >
        {notificationStatus === 'sending' ? (
          <span className="flex items-center justify-center gap-3">
            <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse"></span>
            SENDING NOTIFICATIONS...
          </span>
        ) : (
          `📤 SEND TO ${affectedCustomers + affectedKitchens} RECIPIENTS`
        )}
      </button>

      {/* Notification Result */}
      {notificationResult && (
        <div className={`p-4 border-2 ${
          notificationStatus === 'success' 
            ? 'bg-verified/10 border-verified' 
            : 'bg-critical/10 border-critical'
        }`}>
          <div className={`text-[11px] font-bold font-mono tracking-wider ${
            notificationStatus === 'success' ? 'text-verified' : 'text-critical'
          }`}>
            {notificationResult}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-canvas border-l-4 border-accent p-4">
        <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">ℹ️ Notification Info</div>
        <p className="text-[10px] text-ink leading-relaxed">
          Notifications will be sent via Email and SMS to all affected customers and official email to all affected kitchens. 
          All notifications are logged for regulatory compliance and audit trail.
        </p>
      </div>
    </section>
  );
};
