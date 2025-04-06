<template>
  <div class="crud-list">
    <!-- Filter and actions bar -->
    <v-row class="mb-2">
      <!-- Search input removed -->
      
      <v-spacer></v-spacer>
      
      <!-- Delete button - always visible -->
      <v-col cols="12" sm="auto">
        <v-btn
          variant="outlined"
          color="error"
          prepend-icon="tabler-trash"
          :disabled="selectedItems.length === 0"
          @click="confirmBulkDelete"
          class="mr-2"
        >
          {{ $t('common.delete', 'Delete') }}
        </v-btn>
      </v-col>
      
      <!-- Export button -->
      <v-col v-if="config.canExport" cols="12" sm="auto">
        <v-menu>
          <template v-slot:activator="{ props: menuProps }">
            <v-btn
              color="primary"
              variant="outlined"
              v-bind="menuProps"
              prepend-icon="tabler-download"
            >
              {{ $t('common.export', 'Export') }}
            </v-btn>
          </template>
        </v-menu>
      </v-col>
      
      <!-- Column visibility button -->
      <v-col cols="12" sm="auto">
        <v-menu>
          <template v-slot:activator="{ props: menuProps }">
            <v-btn
              variant="outlined"
              v-bind="menuProps"
              prepend-icon="tabler-columns"
            >
              {{ $t('common.columns', 'Columns') }}
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="column in availableColumns" :key="column.key" @click="toggleColumnVisibility(column)">
              <template v-slot:prepend>
                <v-checkbox
                  v-model="visibleColumns"
                  :value="column.key"
                  hide-details
                  density="compact"
                ></v-checkbox>
              </template>
              <v-list-item-title>{{ column.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
      
      <!-- Action buttons -->
      <v-col cols="12" sm="auto" class="d-flex align-center">
        <v-btn
          v-if="config.canAdd"
          color="primary"
          prepend-icon="tabler-plus"
          @click="handleAddItem"
        >
          {{ $t('common.add', 'Add') }}
        </v-btn>
      </v-col>
    </v-row>
    
    <!-- Desktop view with data table -->
    <template v-if="!isMobile">
      <v-data-table
        v-model="selectedItems"
        show-select
        v-model:items-per-page="itemsPerPage"
        :headers="displayHeaders"
        :items="items"
        :loading="loading"
        :sort-by="sortBy"
        class="elevation-1 rounded"
        @update:sort-by="handleSort"
        @update:options="handleTableOptionsChange"
        @click:row="handleRowClick"
      >
        <!-- Loading state -->
        <template v-slot:loading>
          <v-skeleton-loader
            type="table-row"
            :loading="loading"
            class="my-2"
          ></v-skeleton-loader>
        </template>
        
        <!-- Empty state -->
        <template v-slot:no-data>
          <div class="d-flex flex-column align-center py-6">
            <v-icon
              icon="tabler-database-off"
              size="48"
              class="mb-4 text-medium-emphasis"
            ></v-icon>
            <span class="text-medium-emphasis">{{ $t('common.no_data_available', 'No data available') }}</span>
          </div>
        </template>
        
        <!-- Editable cells -->
        <template v-for="column in editableColumns" :key="`item.${column.key}`" v-slot:[`item.${column.key}`]="{ item }">
          <div v-if="editingRow && editingRow.id === item.raw.id">
            <!-- Editable field -->
            <v-text-field
              v-if="column.type === 'text' || !column.type"
              v-model="editingRow[column.key]"
              variant="outlined"
              density="compact"
              hide-details
              @keyup.enter="saveInlineEdit"
              @keyup.esc="cancelInlineEdit"
            ></v-text-field>
            
            <v-select
              v-else-if="column.type === 'select'"
              v-model="editingRow[column.key]"
              :items="column.options"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
            
            <v-checkbox
              v-else-if="column.type === 'boolean'"
              v-model="editingRow[column.key]"
              hide-details
              density="compact"
            ></v-checkbox>
            
            <!-- Other input types as needed -->
          </div>
          <div v-else>
            <slot :name="`item.${column.key}`" :item="item">
              {{ item.raw[column.key] }}
            </slot>
          </div>
        </template>
        
        <!-- Custom formatted fields slots -->
        <template v-for="slot in Object.keys($slots)" :key="slot" v-slot:[slot]="slotProps">
          <slot :name="slot" v-bind="slotProps"></slot>
        </template>
      </v-data-table>
    </template>
    
    <!-- Mobile view with cards -->
    <template v-else>
      <div class="mobile-list">
        <v-card 
          v-for="item in items" 
          :key="item.id" 
          class="mb-4"
          :class="{ 'selected': selectedItems.includes(item) }"
          @click="handleRowClick({ item: { raw: item } })"
        >
          <v-card-item>
            <v-card-title>
              <div class="d-flex align-center">
                <v-checkbox
                  v-model="selectedItems"
                  :value="item"
                  hide-details
                  density="compact"
                  class="mr-2"
                  @click.stop
                ></v-checkbox>
                {{ getPrimaryField(item) }}
              </div>
            </v-card-title>
            
            <!-- Item details -->
            <div class="mt-2">
              <div v-for="column in visibleMobileColumns" :key="column.key" class="d-flex py-1">
                <div class="text-caption text-medium-emphasis" style="width: 40%">
                  {{ column.title }}:
                </div>
                <div style="width: 60%">
                  <slot :name="`item.${column.key}`" :item="{ raw: item }">
                    {{ item[column.key] }}
                  </slot>
                </div>
              </div>
            </div>
          </v-card-item>
        </v-card>
        
        <!-- Mobile pagination -->
        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="pagination.page"
            :length="Math.ceil(pagination.total / pagination.limit)"
            :total-visible="5"
          ></v-pagination>
        </div>
      </div>
    </template>
    
    <!-- Confirmation dialog for delete operations -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">{{ $t('common.confirm_delete', 'Confirm Delete') }}</v-card-title>
        <v-card-text>{{ $t('common.delete_confirmation_message', 'Are you sure you want to delete this item? This action cannot be undone.') }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog = false">
            {{ $t('common.cancel', 'Cancel') }}
          </v-btn>
          <v-btn 
            color="error" 
            variant="elevated" 
            @click="confirmDelete"
            :loading="deleteLoading"
          >
            {{ $t('common.delete', 'Delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Confirmation dialog for bulk delete operations -->
    <v-dialog v-model="bulkDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">{{ $t('common.confirm_bulk_delete', 'Confirm Bulk Delete') }}</v-card-title>
        <v-card-text>
          {{ $t('common.bulk_delete_confirmation_message', 'Are you sure you want to delete the selected items? This action cannot be undone.') }}
          <div class="mt-2">
            {{ $t('common.items_to_delete', 'Items to delete') }}: {{ selectedItems.length }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="bulkDeleteDialog = false">
            {{ $t('common.cancel', 'Cancel') }}
          </v-btn>
          <v-btn 
            color="error" 
            variant="elevated" 
            @click="doBulkDelete"
            :loading="bulkDeleteLoading"
          >
            {{ $t('common.delete', 'Delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Bulk edit dialog -->
    <v-dialog v-model="bulkEditDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5">{{ $t('common.bulk_edit', 'Bulk Edit') }}</v-card-title>
        <v-card-text>
          <div class="mb-4">
            {{ $t('common.bulk_edit_description', 'Edit multiple items at once. Only the fields you modify will be updated.') }}
          </div>
          
          <v-form ref="bulkEditForm">
            <v-row>
              <v-col 
                v-for="column in editableColumns" 
                :key="column.key" 
                cols="12" 
                sm="6"
              >
                <!-- Different field types -->
                <template v-if="column.type === 'text' || !column.type">
                  <v-text-field
                    v-model="bulkEditData[column.key]"
                    :label="column.title"
                    variant="outlined"
                    density="compact"
                    clearable
                    placeholder="Leave empty to keep existing values"
                  ></v-text-field>
                </template>
                
                <template v-else-if="column.type === 'select'">
                  <v-select
                    v-model="bulkEditData[column.key]"
                    :label="column.title"
                    :items="column.options"
                    variant="outlined"
                    density="compact"
                    clearable
                    placeholder="Leave empty to keep existing values"
                  ></v-select>
                </template>
                
                <template v-else-if="column.type === 'boolean'">
                  <v-checkbox
                    v-model="bulkEditApplyFields[column.key]"
                    :label="`Update ${column.title}`"
                    hide-details
                    class="mb-2"
                  ></v-checkbox>
                  <v-checkbox
                    v-if="bulkEditApplyFields[column.key]"
                    v-model="bulkEditData[column.key]"
                    :label="column.title"
                    hide-details
                  ></v-checkbox>
                </template>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="bulkEditDialog = false">
            {{ $t('common.cancel', 'Cancel') }}
          </v-btn>
          <v-btn 
            color="primary" 
            variant="elevated" 
            @click="applyBulkEdit"
            :loading="bulkEditLoading"
          >
            {{ $t('common.apply', 'Apply') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useApi } from '~/composables/api';
import { useRouter } from '#app';
import { useI18n } from 'vue-i18n';
import { getLocalizedPath } from '@/utils/i18n-helpers';
import { useDisplay } from 'vuetify';
import { useLocalStorage } from '@vueuse/core';
import { useNotification } from '~/composables/useNotification';
import { useCache } from '~/composables/useCache';
import { exportToCSV, exportToExcel, exportToJSON } from '~/utils/exportHelpers';
import { useCrudOperations } from '~/composables/useCrudOperations';
import debounce from 'lodash-es/debounce';

// Composables
const api = useApi();
const router = useRouter();
const { t, locale } = useI18n();
const notification = useNotification();
const cache = useCache();
const { mobile } = useDisplay();

// Props definition
const props = defineProps({
  // Base API endpoint for CRUD operations, e.g. 'users'
  apiConfig: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.list !== undefined;
    }
  },
  // Table columns configuration with optional i18n support
  columns: {
    type: Array,
    required: true
  },
  // CRUD permissions and configuration
  config: {
    type: Object,
    default: () => ({
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canInlineEdit: false,
      canExport: true,
      canSelect: true,
      // Customize path suffixes for different operations (optional)
      viewPath: '', // e.g. '/view'
      addPath: '/add',
      editPath: '/edit',
      // Query params (optional)
      defaultParams: {},
      primaryKey: 'id'
    })
  },
  // Initial sort configuration (optional)
  initialSort: {
    type: Array,
    default: () => [{ key: 'id', order: 'desc' }]
  },
  // Cache TTL in ms (default: 5 minutes)
  cacheTTL: {
    type: Number,
    default: 5 * 60 * 1000
  }
});

// Emits
const emit = defineEmits([
  'update:items',
  'item-added',
  'item-edited',
  'item-deleted',
  'batch-edited',
  'batch-deleted',
  'error'
]);

// Reactive state
const isMobile = computed(() => mobile.value);
const items = ref([]);
const loading = ref(false);
const itemsPerPage = ref(10);
const sortBy = ref(props.initialSort);
const pagination = ref({
  page: 1,
  total: 0,
  limit: 10
});
const deleteDialog = ref(false);
const deleteLoading = ref(false);
const itemToDelete = ref(null);
const bulkDeleteDialog = ref(false);
const bulkDeleteLoading = ref(false);
const selectedItems = ref([]);
const editingRow = ref(null);
const bulkEditDialog = ref(false);
const bulkEditLoading = ref(false);
const bulkEditData = ref({});
const bulkEditApplyFields = ref({});
const bulkEditForm = ref(null);
const visibleColumns = ref(props.columns.filter(col => !col.hidden).map(col => col.key));

// Storage key for user preferences
const storageKey = computed(() => `crud-preferences-${props.apiConfig.list}`);

// User preferences
const userPreferences = useLocalStorage(storageKey, {
  itemsPerPage: 10,
  visibleColumns: props.columns.filter(col => !col.hidden).map(col => col.key),
  sortBy: props.initialSort
}, { deep: true });

// Cache key based on current params
const cacheKey = computed(() => {
  return `${props.apiConfig.list}-${pagination.value.page}-${pagination.value.limit}-${JSON.stringify(sortBy.value)}`;
});

// Computed properties
const localizedHeaders = computed(() => {
  return props.columns.map(column => {
    return {
      ...column,
      title: column.i18n ? t(column.i18n) : column.title
    };
  });
});

// Filter visible columns based on user preferences
const displayHeaders = computed(() => {
  return localizedHeaders.value.filter(header => visibleColumns.value.includes(header.key));
});

// Available columns for visibility toggle
const availableColumns = computed(() => {
  return localizedHeaders.value.filter(col => col.key !== 'actions');
});

// Columns that support inline editing
const editableColumns = computed(() => {
  return props.columns.filter(col => col.editable && col.key !== 'actions');
});

// Columns to show in mobile view
const visibleMobileColumns = computed(() => {
  // Show fewer columns on mobile
  return displayHeaders.value.filter(col => col.key !== 'actions').slice(0, 4);
});

// Initialize CRUD operations
const crudOps = useCrudOperations(props.apiConfig, {
  itemsPerPage: itemsPerPage.value,
  showSuccessNotifications: false
});

// Methods

// Handle column visibility toggle
const toggleColumnVisibility = (column) => {
  const index = visibleColumns.value.indexOf(column.key);
  if (index !== -1) {
    // Don't remove if it's the last visible column
    if (visibleColumns.value.length > 1) {
      visibleColumns.value.splice(index, 1);
    }
  } else {
    visibleColumns.value.push(column.key);
  }
  
  // Update user preferences
  userPreferences.value.visibleColumns = visibleColumns.value;
};

// Handle table options change (pagination, sorting, etc.)
const handleTableOptionsChange = (options) => {
  // Update pagination
  if (options.itemsPerPage !== itemsPerPage.value) {
    itemsPerPage.value = options.itemsPerPage;
    pagination.value.limit = options.itemsPerPage;
    userPreferences.value.itemsPerPage = options.itemsPerPage;
  }
  
  if (options.page !== pagination.value.page) {
    pagination.value.page = options.page;
  }
  
  // Fetch data with new options if needed
  fetchData();
};

// Start inline editing
const startInlineEdit = (item) => {
  // Clone the item to avoid directly modifying the original
  editingRow.value = JSON.parse(JSON.stringify(item));
};

// Save inline edit
const saveInlineEdit = async () => {
  if (!editingRow.value) return;
  
  try {
    const result = await crudOps.updateItem(editingRow.value.id, editingRow.value);
    
    if (result.success) {
      // Update item in local list
      const index = items.value.findIndex(item => item.id === editingRow.value.id);
      if (index !== -1) {
        items.value[index] = result.data;
      }
      
      notification.success(t('common.item_updated', 'Item updated successfully'));
      emit('item-edited', result.data);
      editingRow.value = null;
    }
  } catch (error) {
    notification.error(t('common.update_failed', 'Update failed: {0}', [error.message]));
  }
};

// Cancel inline edit
const cancelInlineEdit = () => {
  editingRow.value = null;
};

// Confirm bulk delete
const confirmBulkDelete = () => {
  if (selectedItems.value.length === 0) {
    notification.warning(t('common.no_items_selected', 'No items selected'));
    return;
  }
  
  bulkDeleteDialog.value = true;
};

// Perform bulk delete
const doBulkDelete = async () => {
  if (selectedItems.value.length === 0) return;
  
  bulkDeleteLoading.value = true;
  
  try {
    // Get all selected item IDs
    const ids = selectedItems.value.map(item => item.id);
    const totalItems = ids.length;
    
    // Track results
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Delete items one by one
    for (const item of selectedItems.value) {
      try {
        // Build delete endpoint
        let deleteEndpoint;
        if (props.apiConfig.delete) {
          deleteEndpoint = props.apiConfig.delete.replace(':id', item.id);
        } else {
          const resourceName = props.apiConfig.list.split('/').filter(Boolean).pop();
          deleteEndpoint = `${resourceName}/${item.id}`;
        }
        
        // Delete item
        const response = await api.delete(deleteEndpoint);
        
        if (response.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`ID ${item.id}: ${response.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`ID ${item.id}: ${error.message}`);
      }
    }
    
    // Remove deleted items from the local list
    if (results.success > 0) {
      items.value = items.value.filter(item => !ids.includes(item.id));
    }
    
    // Show result notification
    if (results.failed === 0) {
      notification.success(t('common.items_deleted', '{0} items deleted successfully', [results.success]));
    } else if (results.success > 0) {
      notification.warning(
        t('common.bulk_delete_partial', 'Deleted {0} items, {1} failed', [results.success, results.failed])
      );
    } else {
      notification.error(t('common.bulk_delete_failed', 'Failed to delete any items'));
    }
    
    // Clear selection
    selectedItems.value = [];
    
    // Emit event
    emit('batch-deleted', {
      deleted: results.success,
      failed: results.failed,
      errors: results.errors
    });
    
    // Close dialog
    bulkDeleteDialog.value = false;
    
    // Refresh data if needed
    if (results.success > 0) {
      // Clear cache
      cache.clear(props.apiConfig.list);
      
      // Only reload if there are still items to display
      if (items.value.length === 0 && pagination.value.page > 1) {
        pagination.value.page--;
      }
      
      // Reload data
      fetchData();
    }
  } catch (error) {
    notification.error(t('common.delete_failed', 'Delete failed: {0}', [error.message]));
  } finally {
    bulkDeleteLoading.value = false;
  }
};

// Open bulk edit dialog
const openBulkEditDialog = () => {
  if (selectedItems.value.length === 0) {
    notification.warning(t('common.no_items_selected', 'No items selected'));
    return;
  }
  
  // Reset bulk edit data
  bulkEditData.value = {};
  bulkEditApplyFields.value = {};
  
  // Initialize apply fields for boolean values
  editableColumns.value.forEach(col => {
    if (col.type === 'boolean') {
      bulkEditApplyFields.value[col.key] = false;
    }
  });
  
  bulkEditDialog.value = true;
};

// Apply bulk edit
const applyBulkEdit = async () => {
  if (selectedItems.value.length === 0) return;
  
  // Filter out empty values and check if there's anything to update
  const updateData = {};
  let hasUpdates = false;
  
  Object.entries(bulkEditData.value).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // For boolean fields, only include if the field is flagged for update
      if (bulkEditApplyFields.value[key] !== undefined) {
        if (bulkEditApplyFields.value[key]) {
          updateData[key] = value;
          hasUpdates = true;
        }
      } else {
        updateData[key] = value;
        hasUpdates = true;
      }
    }
  });
  
  if (!hasUpdates) {
    notification.warning(t('common.no_changes', 'No changes to apply'));
    return;
  }
  
  bulkEditLoading.value = true;
  
  try {
    // Track success and failures
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Update each item
    for (const item of selectedItems.value) {
      try {
        const result = await crudOps.updateItem(item.id, updateData);
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`ID ${item.id}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`ID ${item.id}: ${error.message}`);
      }
    }
    
    if (results.success > 0) {
      if (results.failed > 0) {
        notification.warning(
          t('common.bulk_edit_partial', 'Updated {0} items, {1} failed', [results.success, results.failed])
        );
      } else {
        notification.success(
          t('common.bulk_edit_success', 'Successfully updated {0} items', [results.success])
        );
      }
      
      emit('batch-edited', {
        updated: results.success,
        failed: results.failed,
        data: updateData
      });
      
      // Refresh data
      fetchData();
      bulkEditDialog.value = false;
    } else {
      notification.error(t('common.bulk_edit_failed', 'Failed to update any items'));
    }
  } catch (error) {
    notification.error(t('common.update_failed', 'Update failed: {0}', [error.message]));
  } finally {
    bulkEditLoading.value = false;
  }
};

// Get primary field for mobile card title
const getPrimaryField = (item) => {
  const primaryField = props.columns.find(col => col.primary) || props.columns[0];
  return item[primaryField.key];
};

// Export data functions
const exportData = async (format) => {
  try {
    loading.value = true;
    
    // Fetch all data for export (remove pagination)
    const params = new URLSearchParams({
      ...props.config.defaultParams,
      limit: '1000' // Get more records for export
    });
    
    if (sortBy.value.length) {
      const sort = sortBy.value[0];
      params.append('sortBy', sort.key);
      params.append('sortOrder', sort.order);
    }
    
    let endpoint;
    if (props.apiConfig.export) {
      endpoint = props.apiConfig.export;
    } else {
      endpoint = props.apiConfig.list;
    }
    
    const queryString = params.toString();
    const fullEndpoint = `${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(fullEndpoint);
    
    if (response.success) {
      let dataToExport;
      
      if (response.data.items) {
        dataToExport = response.data.items;
      } else if (Array.isArray(response.data)) {
        dataToExport = response.data;
      } else {
        dataToExport = response.data.data || [];
      }
      
      // Process data - only include visible columns
      const visibleCols = props.columns.filter(col => 
        visibleColumns.value.includes(col.key) && col.key !== 'actions'
      );
      
      const processedData = dataToExport.map(item => {
        const row = {};
        visibleCols.forEach(col => {
          row[col.i18n ? t(col.i18n) : col.title] = item[col.key];
        });
        return row;
      });
      
      // Export based on format
      switch (format) {
        case 'csv':
          exportToCSV(processedData, `${props.apiConfig.list}-export`);
          break;
        case 'excel':
          exportToExcel(processedData, `${props.apiConfig.list}-export`);
          break;
        case 'json':
          exportToJSON(processedData, `${props.apiConfig.list}-export`);
          break;
      }
      
      notification.success(t('common.export_success', 'Data exported successfully as {0}', [format.toUpperCase()]));
    } else {
      notification.error(t('common.export_failed', 'Error exporting data: {0}', [response.error]));
    }
  } catch (error) {
    notification.error(t('common.export_failed', 'Export failed: {0}', [error.message]));
  } finally {
    loading.value = false;
  }
};

// Fetch data with caching and improved error handling
const fetchData = async (retryCount = 0) => {
  loading.value = true;
  
  // Check cache first
  const cachedData = cache.get(cacheKey.value);
  if (cachedData && !retryCount) {
    items.value = cachedData.items;
    pagination.value = cachedData.pagination;
    emit('update:items', items.value);
    loading.value = false;
    return;
  }
  
  try {
    // Prepare query parameters
    const params = {
      ...props.config.defaultParams,
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    };
    
    // Add sort parameters if available
    if (sortBy.value.length) {
      const sort = sortBy.value[0];
      params.sortBy = sort.key;
      params.sortOrder = sort.order;
    }
    
    // Use CRUD operations to fetch data
    console.log('Sending params to API:', params);
    const result = await crudOps.fetchData(params);
    
    if (!result.error) {
      items.value = crudOps.items.value;
      pagination.value = crudOps.pagination.value;
      
      // Cache the results
      cache.set(cacheKey.value, {
        items: items.value,
        pagination: pagination.value
      }, props.cacheTTL);
      
      // Emit the updated items
      emit('update:items', items.value);
    } else {
      emit('error', result.error);
    }
  } catch (error) {
    console.error('Error in fetchData:', error);
    emit('error', error.message);
    
    // Retry for network errors
    if (retryCount < 3 && (error.code === 'ECONNABORTED' || !error.response)) {
      setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
      return;
    }
  } finally {
    loading.value = false;
  }
};

// Handle sort change
const handleSort = (event) => {
  sortBy.value = event;
  
  // Update user preferences
  userPreferences.value.sortBy = event;
  
  // Fetch data with new sorting
  fetchData();
};

// Navigation handlers
const handleViewItem = (item) => {
  if (props.config.viewPath !== undefined) {
    // Use view endpoint if provided, otherwise construct path
    if (props.apiConfig.view) {
      const path = props.apiConfig.view.replace(':id', item.id);
      router.push(getLocalizedPath(path, locale.value));
    } else {
      const resourceName = props.apiConfig.list.split('/').filter(Boolean).pop();
      const path = `/${resourceName}/${item.id}${props.config.viewPath}`;
      router.push(getLocalizedPath(path, locale.value));
    }
  }
};

const handleAddItem = () => {
  // Use create endpoint if provided, otherwise construct path
  if (props.apiConfig.create) {
    router.push(getLocalizedPath(props.apiConfig.create, locale.value));
  } else {
    const resourceName = props.apiConfig.list.split('/').filter(Boolean).pop();
    const path = `/${resourceName}${props.config.addPath}`;
    router.push(getLocalizedPath(path, locale.value));
  }
};

const handleEditItem = (item) => {
  // Use edit endpoint if provided, otherwise construct path
  if (props.apiConfig.edit) {
    const path = props.apiConfig.edit.replace(':id', item.id);
    router.push(getLocalizedPath(path, locale.value));
  } else {
    const resourceName = props.apiConfig.list.split('/').filter(Boolean).pop();
    const path = `/${resourceName}/${item.id}${props.config.editPath}`;
    router.push(getLocalizedPath(path, locale.value));
  }
};

const handleDeleteItem = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  
  deleteLoading.value = true;
  try {
    const result = await crudOps.deleteItem(itemToDelete.value.id);
    
    if (result.success) {
      // Remove from local list
      items.value = items.value.filter(item => item.id !== itemToDelete.value.id);
      notification.success(t('common.item_deleted', 'Item deleted successfully'));
      emit('item-deleted', itemToDelete.value);
      deleteDialog.value = false;
      
      // Clear cache for this view
      cache.clear(props.apiConfig.list);
    }
  } catch (error) {
    notification.error(t('common.delete_failed', 'Delete failed: {0}', [error.message]));
  } finally {
    deleteLoading.value = false;
  }
};

// Watch for pagination changes
watch(() => pagination.value.page, () => {
  fetchData();
});

watch(() => pagination.value.limit, () => {
  fetchData();
});

// Lifecycle hooks
onMounted(() => {
  // Apply saved preferences
  if (userPreferences.value) {
    itemsPerPage.value = userPreferences.value.itemsPerPage;
    pagination.value.limit = userPreferences.value.itemsPerPage;
    
    if (userPreferences.value.sortBy) {
      sortBy.value = userPreferences.value.sortBy;
    }
    
    if (userPreferences.value.visibleColumns) {
      visibleColumns.value = userPreferences.value.visibleColumns;
    }
  }
  
  fetchData();
});

// Add this method to the script section
const handleRowClick = (props) => {
  // Don't trigger edit if we're already editing something
  if (editingRow.value) return;
  
  // Get the clicked item
  const item = props.item.raw;
  
  // Navigate to edit page
  handleEditItem(item);
};
</script>

<style scoped>
.crud-list {
  width: 100%;
}

/* Mobile view styles */
.mobile-list .v-card.selected {
  border: 2px solid rgb(var(--v-theme-primary));
}

/* Animation for filter panel */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease-out;
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Custom scrollbar for tables */
:deep(.v-data-table__wrapper) {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

:deep(.v-data-table__wrapper::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.v-data-table__wrapper::-webkit-scrollbar-track) {
  background: #f1f1f1;
}

:deep(.v-data-table__wrapper::-webkit-scrollbar-thumb) {
  background: #ccc;
  border-radius: 4px;
}

:deep(.v-data-table__wrapper::-webkit-scrollbar-thumb:hover) {
  background: #999;
}
</style> 