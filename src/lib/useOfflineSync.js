import { useEffect, useCallback, useRef } from 'react';
import { useNetwork } from './NetworkContext';
import { getQueuedActions, updateQueuedActionStatus, removeQueuedAction } from './offlineDB';
import { base44 } from '@/api/base44Client';

export function useOfflineSync() {
  const { isOnline } = useNetwork();
  const syncInProgressRef = useRef(false);

  const syncQueuedActions = useCallback(async () => {
    if (syncInProgressRef.current || !isOnline) return;
    syncInProgressRef.current = true;

    try {
      const queuedActions = await getQueuedActions();

      for (const action of queuedActions) {
        if (action.status === 'pending' || action.status === 'failed') {
          try {
            await updateQueuedActionStatus(action.id, 'syncing');

            // Execute the action based on type
            if (action.type === 'sendMessage') {
              await base44.entities.Message.create(action.payload);
            } else if (action.type === 'createTransportRequest') {
              await base44.entities.TransportRequest.create(action.payload);
            } else if (action.type === 'createCabinRequest') {
              await base44.entities.CabinRequest.create(action.payload);
            }

            await removeQueuedAction(action.id);
            console.log('[Offline Sync] Action synced:', action.id);
          } catch (error) {
            console.error('[Offline Sync] Failed to sync action:', action.id, error);
            action.retries = (action.retries || 0) + 1;

            if (action.retries > 5) {
              await updateQueuedActionStatus(action.id, 'failed');
            } else {
              await updateQueuedActionStatus(action.id, 'failed');
            }
          }
        }
      }
    } catch (error) {
      console.error('[Offline Sync] Error syncing queued actions:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isOnline]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        syncQueuedActions();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, syncQueuedActions]);

  return { syncQueuedActions };
}