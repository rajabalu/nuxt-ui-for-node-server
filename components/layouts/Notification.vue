<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNotifications } from '~/composables/useNotifications';

// Define Notification type locally if not available globally, based on API spec
// This should ideally be in a central types file (e.g., ~/types/notification.ts)
interface User {
  id: string;
  // Add other user properties if available and needed from API response
  // name?: string; 
}

interface Notification {
  id: string;
  readAt: string | null;
  isRead: boolean | null;
  notificationType: string | null;
  message: string | null;
  user: User; 
  createdAt: string;
  updatedAt: string;
}

const { t } = useI18n();

const { 
  notifications, 
  loading, 
  error, 
  hasNextPage, 
  fetchNotifications, 
  markAsRead, 
  markAsUnread, 
  deleteNotification 
} = useNotifications();

const selectedNotification = ref<Notification | null>(null);
const dialogVisible = ref(false);

const handleNotificationClick = (notification: Notification) => {
  selectedNotification.value = notification;
  dialogVisible.value = true;
  // Mark as read when opened
  if (!notification.isRead) {
    markAsRead(notification.id);
  }
};

const handleMarkAsRead = (id: string) => {
  markAsRead(id);
};

const handleMarkAsUnread = (id: string) => {
  markAsUnread(id);
};

const handleDelete = (id: string) => {
  deleteNotification(id);
  // Optionally close dialog if the deleted notification was being viewed
  if (selectedNotification.value?.id === id) {
    dialogVisible.value = false;
    selectedNotification.value = null;
  }
};

const handleLoadMore = () => {
  fetchNotifications(true); // Pass true to load the next page
};

</script>

<template>
  <v-menu 
    :close-on-content-click="false" 
    width="380" 
    max-height="450" 
    location="bottom end" 
    offset="12px"
    transition="scale-transition"
    origin="top right"
  >
    <template #activator="{ props: menuProps }">
      <v-tooltip location="bottom" :text="t('notifications.toggleMenu')">
        <template #activator="{ props: tooltipProps }">
          <icon-btn 
            class="mr-2 ml-1" 
            v-bind="{ ...menuProps, ...tooltipProps }" 
            :aria-label="t('notifications.toggleMenu')"
           >
            <v-badge 
              :content="notifications.filter(n => !n.isRead).length" 
              :model-value="notifications.filter(n => !n.isRead).length > 0"
              color="error"
              offset-x="-2"
              offset-y="-2"
            >
              <v-icon size="25" icon="tabler-bell" />
            </v-badge>
          </icon-btn>
        </template>
      </v-tooltip>
    </template>
    
    <v-card 
      color="notification-card" 
      rounded="lg" 
      class="d-flex flex-column"
      style="height: 450px;" 
    >
      <div class="notification-card__header bg-surface rounded-t px-4 py-3 flex-shrink-0">
        <div class="d-flex align-center justify-space-between">
            <h4 class="text-h4">{{ t('notifications.title') }}</h4>
            <v-tooltip location="bottom" :text="t('common.refresh')">
              <template #activator="{ props }">
                 <icon-btn 
                    size="small" 
                    icon="tabler-refresh" 
                    :loading="loading && notifications.length > 0"
                    @click="fetchNotifications()"
                    :aria-label="t('common.refresh')"
                    v-bind="props"
                  />
              </template>
            </v-tooltip>
        </div>
        <v-divider class="mt-2"/>
      </div>

      <v-card-text class="pa-0 ma-0 flex-grow-1 overflow-y-auto">
        <v-list density="compact">
          <template v-if="loading && notifications.length === 0">
            <v-list-item><v-progress-circular indeterminate color="primary"/></v-list-item>
          </template>
          <template v-else-if="error">
            <v-list-item>
              <v-list-item-title class="text-error">{{ error }}</v-list-item-title>
            </v-list-item>
          </template>
          <template v-else-if="notifications.length === 0">
             <v-list-item>
              <v-list-item-title>No notifications</v-list-item-title>
            </v-list-item>
          </template>
           <template v-else>
             <template v-for="(item, index) in notifications" :key="item.id">
              <v-list-item
                :class="['notification-item', { 'bg-surface-light': !item.isRead, 'font-weight-medium': !item.isRead }]"
                @click="handleNotificationClick(item)"
                style="cursor: pointer;"
                :value="item.id" 
                active-color="primary"
              >
                <v-list-item-title class="text-subtitle-1 mb-1">{{ item.notificationType || 'Notification' }}</v-list-item-title>
                <v-list-item-subtitle class="text-body-2 text-grey-darken-1 text-truncate">{{ item.message }}</v-list-item-subtitle>
                
                 <template v-slot:append>
                   <div class="d-flex ga-1 align-center">
                      <v-tooltip v-if="!item.isRead" location="top" :text="t('notifications.markAsRead')">
                        <template #activator="{ props }">
                          <icon-btn
                            size="x-small"
                            icon="tabler-mail"
                            @click.stop="handleMarkAsRead(item.id)"
                            :aria-label="t('notifications.markAsRead')"
                            v-bind="props"
                          />
                        </template>
                      </v-tooltip>
                       <v-tooltip v-if="item.isRead" location="top" :text="t('notifications.markAsUnread')">
                          <template #activator="{ props }">
                             <icon-btn
                               size="x-small"
                               icon="tabler-mail-opened"
                               @click.stop="handleMarkAsUnread(item.id)"
                               :aria-label="t('notifications.markAsUnread')"
                               v-bind="props"
                             />
                          </template>
                        </v-tooltip>
                        <v-tooltip location="top" :text="t('common.delete')">
                           <template #activator="{ props }">
                              <icon-btn 
                                size="x-small" 
                                icon="tabler-trash" 
                                color="error"
                                @click.stop="handleDelete(item.id)"
                                :aria-label="t('common.delete')"
                                v-bind="props"
                              />
                           </template>
                        </v-tooltip>
                   </div>
                  </template>
              </v-list-item>
              <v-divider v-if="index < notifications.length - 1" />
            </template>
            
             <v-list-item v-if="hasNextPage" class="text-center">
              <v-btn 
                variant="text" 
                color="primary" 
                @click="handleLoadMore" 
                :loading="loading"
              >
                Load More
              </v-btn>
            </v-list-item>
          </template>
        </v-list>
       
      </v-card-text>

    </v-card>
  </v-menu>

  <v-dialog v-model="dialogVisible" max-width="600" scrollable>
    <v-card v-if="selectedNotification" rounded="lg">
      <v-card-title class="d-flex justify-space-between align-center text-h6 pa-4">
        <span>{{ selectedNotification.notificationType || t('notifications.detailsTitle') }}</span>
         <v-tooltip location="bottom" :text="t('common.close')">
          <template #activator="{ props }">
             <icon-btn 
                icon="tabler-x" 
                size="small" 
                @click="dialogVisible = false"
                :aria-label="t('common.close')"
                v-bind="props"
              />
          </template>
        </v-tooltip>
      </v-card-title>
      <v-divider/>
      <v-card-text class="py-4" style="max-height: 400px; overflow-y: auto;">
        <p class="text-body-1">{{ selectedNotification.message }}</p>
        <p class="text-caption text-grey mt-2">Received: {{ new Date(selectedNotification.createdAt).toLocaleString() }}</p>
      </v-card-text>
       <v-divider/>
      <v-card-actions class="pa-3 justify-end ga-2">
         <!-- Mark as Unread Button (Only shown if already read) -->
         <v-btn
            v-if="selectedNotification.isRead"
            @click="handleMarkAsUnread(selectedNotification!.id); dialogVisible = false;"
            variant="outlined"
            size="small"
            prepend-icon="tabler-mail"
         >{{ t('notifications.markAsUnread') }}</v-btn>
         <!-- Delete Button -->
        <v-btn
          color="error"
          @click="handleDelete(selectedNotification!.id)"
          variant="flat"
          size="small"
          prepend-icon="tabler-trash"
        >{{ t('common.delete') }}</v-btn>
        <!-- Close Button -->
        <v-btn
          @click="dialogVisible = false"
          variant="text"
          size="small"
        >{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.notification-card {
}

.notification-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
