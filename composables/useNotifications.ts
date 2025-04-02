import { ref, onMounted, computed } from 'vue';
import { useApi } from '~/composables/api';

// Define the structure of a Notification based on the API schema
interface User {
  id: string;
  // Add other user properties if available and needed
}

interface Notification {
  id: string;
  readAt: string | null;
  isRead: boolean | null;
  notificationType: string | null;
  message: string | null;
  user: User; // Assuming the User object structure based on schema reference
  createdAt: string;
  updatedAt: string;
}

interface InfinityPaginationResponse {
  data: Notification[];
  hasNextPage: boolean;
}


export function useNotifications() {
  const api = useApi();
  const notifications = ref<Notification[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 10, // Default limit, adjust as needed
    hasNextPage: false,
  });

  const fetchNotifications = async (loadMore = false) => {
    if (loading.value) return;
    if (loadMore && !pagination.value.hasNextPage) return; // Don't load more if no more pages

    loading.value = true;
    error.value = null;

    if (loadMore) {
        pagination.value.page++;
    } else {
        // Reset if it's a fresh fetch (not loading more)
        notifications.value = [];
        pagination.value.page = 1;
    }

    const endpoint = `notifications?page=${pagination.value.page}&limit=${pagination.value.limit}`;

    try {
      const response = await api.get(endpoint);

      if (response.success && response.data) {
        const responseData = response.data as InfinityPaginationResponse;
        if (loadMore) {
            notifications.value = [...notifications.value, ...responseData.data];
        } else {
            notifications.value = responseData.data;
        }
        pagination.value.hasNextPage = responseData.hasNextPage;
      } else {
        throw new Error(response.error || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      error.value = err.message || 'An unexpected error occurred.';
      // Reset page number if fetch failed
      if (loadMore) pagination.value.page--;
    } finally {
      loading.value = false;
    }
  };

  const updateNotificationState = (id: string, updates: Partial<Notification>) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index] = { ...notifications.value[index], ...updates };
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    updateNotificationState(id, { isRead: true, readAt: new Date().toISOString() });

    try {
      const response = await api.patch(`notifications/${id}`, { isRead: true });
      if (!response.success) {
        // Revert optimistic update on failure
        updateNotificationState(id, { isRead: false, readAt: null }); // Assuming original state was unread
        error.value = response.error || 'Failed to mark as read';
      } else {
         // Optionally update with server response data if needed
         updateNotificationState(id, response.data as Notification);
      }
    } catch (err: any) {
       // Revert optimistic update on failure
       updateNotificationState(id, { isRead: false, readAt: null }); // Assuming original state was unread
       error.value = err.message || 'An error occurred.';
    }
  };

 const markAsUnread = async (id: string) => {
    // Optimistic update
    updateNotificationState(id, { isRead: false, readAt: null });

    try {
      const response = await api.patch(`notifications/${id}`, { isRead: false });
       if (!response.success) {
        // Revert optimistic update on failure
        updateNotificationState(id, { isRead: true }); // Assuming original state was read
        error.value = response.error || 'Failed to mark as unread';
      } else {
         // Optionally update with server response data if needed
         updateNotificationState(id, response.data as Notification);
      }
    } catch (err: any) {
       // Revert optimistic update on failure
       updateNotificationState(id, { isRead: true }); // Assuming original state was read
       error.value = err.message || 'An error occurred.';
    }
  };


  const deleteNotification = async (id: string) => {
    const originalNotifications = [...notifications.value];
    // Optimistic update
    notifications.value = notifications.value.filter(n => n.id !== id);

    try {
      const response = await api.delete(`notifications/${id}`);
       if (!response.success) {
         // Revert optimistic update on failure
         notifications.value = originalNotifications;
         error.value = response.error || 'Failed to delete notification';
       }
    } catch (err: any) {
       // Revert optimistic update on failure
       notifications.value = originalNotifications;
       error.value = err.message || 'An error occurred.';
    }
  };

  // Initial fetch when the composable is used
  onMounted(() => {
    fetchNotifications();
  });

  // Expose reactive state and methods
  return {
    notifications: computed(() => notifications.value),
    loading,
    error,
    hasNextPage: computed(() => pagination.value.hasNextPage),
    fetchNotifications,
    markAsRead,
    markAsUnread,
    deleteNotification,
  };
} 