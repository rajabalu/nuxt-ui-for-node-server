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
  <v-menu :close-on-content-click="false" width="380" max-height="450">
    <template #activator="{ props }">
      <icon-btn class="mr-2 ml-1" v-bind="props">
        <!-- Optional: Add a badge for unread count -->
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
    <v-card 
      color="notification-card" 
      rounded="lg" 
      class="d-flex flex-column"
      style="height: 450px;" 
    >
      <!-- Card Header -->
      <div class="notification-card__header bg-surface rounded-t px-4 py-3 flex-shrink-0">
        <div class="d-flex align-center justify-space-between">
            <h4 class="text-h4">{{ t('notifications.title') }}</h4>
            <!-- Optional: Add Refresh button? -->
             <icon-btn 
                size="small" 
                icon="tabler-refresh" 
                :loading="loading && notifications.length > 0"
                @click="fetchNotifications()"
                aria-label="Refresh notifications"
                :tooltip-text="t('common.refresh')"
              />
        </div>
        <v-divider class="mt-2"/>
      </div>

      <!-- Card Body (Scrollable List) -->
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
                      <icon-btn 
                        v-if="!item.isRead"
                        size="x-small" 
                        icon="tabler-mail-opened" 
                        @click.stop="handleMarkAsRead(item.id)"
                        aria-label="Mark as read"
                        :tooltip-text="t('notifications.markAsRead')"
                      />
                       <icon-btn 
                        v-if="item.isRead"
                        size="x-small" 
                        icon="tabler-mail" 
                        @click.stop="handleMarkAsUnread(item.id)"
                        aria-label="Mark as unread"
                        :tooltip-text="t('notifications.markAsUnread')"
                      />
                      <icon-btn 
                        size="x-small" 
                        icon="tabler-trash" 
                        color="error"
                        @click.stop="handleDelete(item.id)"
                        aria-label="Delete notification"
                        :tooltip-text="t('common.delete')"
                      />
                   </div>
                  </template>
              </v-list-item>
              <v-divider v-if="index < notifications.length - 1" />
            </template>
            
             <!-- Load More Button -->
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

      <div class="notification-card__footer bg-surface rounded-b px-4 py-2 flex-shrink-0">
        <v-divider class="mb-2"/>
        <div class="text-center">
          <NuxtLink to="/notifications" class="text-primary text-body-2">
             {{ t('notifications.viewAll') }}
          </NuxtLink>
        </div>
      </div>
    </v-card>
  </v-menu>

  <!-- Notification Detail Dialog -->
  <v-dialog v-model="dialogVisible" max-width="600" scrollable>
    <v-card v-if="selectedNotification" rounded="lg">
      <v-card-title class="d-flex justify-space-between align-center text-h6 pa-4">
        <span>{{ selectedNotification.notificationType || t('notifications.detailsTitle') }}</span>
         <icon-btn 
            icon="tabler-x" 
            size="small" 
            @click="dialogVisible = false"
            aria-label="Close dialog"
            :tooltip-text="t('common.close')"
          />
      </v-card-title>
      <v-divider/>
      <v-card-text class="py-4" style="max-height: 400px; overflow-y: auto;">
        <p class="text-body-1">{{ selectedNotification.message }}</p>
        <p class="text-caption text-grey mt-2">Received: {{ new Date(selectedNotification.createdAt).toLocaleString() }}</p>
      </v-card-text>
       <v-divider/>
      <v-card-actions class="pa-3 justify-end ga-2">
        <v-btn 
            v-if="selectedNotification.isRead" 
            @click="handleMarkAsUnread(selectedNotification!.id); dialogVisible = false;"
            variant="outlined" 
            size="small"
            prepend-icon="tabler-mail"
         >{{ t('notifications.markAsUnread') }}</v-btn>
        <v-btn 
            v-else 
            @click="handleMarkAsRead(selectedNotification!.id); dialogVisible = false;" 
            variant="outlined" 
            size="small"
            prepend-icon="tabler-mail-opened"
        >{{ t('notifications.markAsRead') }}</v-btn>
        <v-btn 
          color="error" 
          @click="handleDelete(selectedNotification!.id)" 
          variant="flat" 
          size="small"
          prepend-icon="tabler-trash"
        >{{ t('common.delete') }}</v-btn>
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
// Remove fixed positioning styles as the menu content handles scrolling
// .headerFooter {
//   position: fixed;
//   width: 100%;
// }

.notification-card {
//   &__header {
//     //@extend .headerFooter;
//     //top: 0;
//     //z-index: 2;
//     flex-shrink: 0; // Prevent header from shrinking
//   }

//   &__footer {
//    // @extend .headerFooter;
//    // bottom: 0px;
//    // z-index: 2;
//     flex-shrink: 0; // Prevent footer from shrinking
//   }

  // &__body {
  //   position: absolute; // Remove absolute positioning
  //   top: 55px; // Remove top offset
  //   padding-bottom: 52px !important; // Remove padding offset
  // }
}

.notification-item:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}
</style>
