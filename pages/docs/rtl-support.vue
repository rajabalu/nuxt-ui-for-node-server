<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, computed } from 'vue';
import { useRTL } from '~/composables/useRTL';

const { t } = useI18n();
const { isRTL, layoutDirection, textStyles, rtlClasses, getTransform, flipProperty } = useRTL();

interface ContentItem {
  name: string;
  to: string;
}

const contantList: ContentItem[] = [
  {
    name: "Introduction",
    to: "intro",
  },
  {
    name: "Usage",
    to: "usage",
  },
  {
    name: "RTL Composable",
    to: "rtl-composable",
  },
  {
    name: "CSS Classes",
    to: "css-classes",
  },
  {
    name: "Vuetify Support",
    to: "vuetify-support",
  },
  {
    name: "Best Practices",
    to: "best-practices",
  }
];

// Set SEO meta data
useSeoMeta({
  title: "RTL Support",
  ogTitle: "RTL Support Documentation",
  description: "Documentation for the Right-to-Left (RTL) support system",
  ogDescription: "Learn how to use the Right-to-Left (RTL) support system",
  ogImage: "",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col lg="9" md="12">
        <!-- Introduction -->
        <div id="intro">
          <GlobalsIntro
            page-intro
            title="RTL Support"
            subtitle="A comprehensive system for supporting Right-to-Left (RTL) languages like Arabic, Hebrew, and Persian."
          />
          
          <v-card class="mb-5">
            <v-card-text>
              <p class="text-body-1">
                This application includes a robust system for RTL language support that automatically adapts layouts, 
                text alignment, and UI components based on the current language. This page documents how to use the 
                RTL support system throughout the application.
              </p>
              
              <p class="text-body-1 mt-3">
                The current language is <strong>{{ isRTL ? 'RTL' : 'LTR' }}</strong>. Try changing the language using 
                the language switcher in the top bar to see how the UI adapts.
              </p>
            </v-card-text>
          </v-card>
        </div>
        
        <!-- Usage -->
        <div id="usage" class="mt-10">
          <GlobalsIntro
            title="Usage"
            subtitle="How to use RTL support in your components"
          />
          
          <v-card class="mb-5">
            <v-card-text>
              <p class="text-body-1">
                The RTL system provides multiple ways to handle RTL support:
              </p>
              
              <ol class="mt-3">
                <li class="text-body-1 mb-2">Using the <code>useRTL()</code> composable in your components</li>
                <li class="text-body-1 mb-2">Accessing RTL utilities globally via <code>$rtl</code></li>
                <li class="text-body-1 mb-2">Using the predefined CSS classes</li>
                <li class="text-body-1 mb-2">Leveraging automatic RTL support in global components</li>
              </ol>
              
              <div class="mt-5">
                <h4 class="text-h5 mb-3">Basic Import Steps:</h4>
                <p class="text-body-1">
                  1. Import the useRTL composable from '~/composables/useRTL'<br>
                  2. Destructure the utilities you need<br>
                  3. Apply the styles and utilities in your templates
                </p>
              </div>
            </v-card-text>
          </v-card>
        </div>
        
        <!-- RTL Composable -->
        <div id="rtl-composable" class="mt-10">
          <GlobalsIntro
            title="RTL Composable"
            subtitle="Using the useRTL() composable"
          />
          
          <v-card class="mb-5">
            <v-card-text>
              <p class="text-body-1">
                The <code>useRTL()</code> composable provides reactive utilities for RTL support:
              </p>
              
              <v-table class="mt-4">
                <thead>
                  <tr>
                    <th>Property/Method</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>isRTL</code></td>
                    <td><code>ComputedRef&lt;boolean&gt;</code></td>
                    <td>Whether the current language is RTL</td>
                  </tr>
                  <tr>
                    <td><code>textStyles</code></td>
                    <td><code>ComputedRef&lt;Object&gt;</code></td>
                    <td>Styles for text alignment based on direction</td>
                  </tr>
                  <tr>
                    <td><code>layoutDirection</code></td>
                    <td><code>ComputedRef&lt;Object&gt;</code></td>
                    <td>Flex direction styles for layout components</td>
                  </tr>
                  <tr>
                    <td><code>rtlClasses</code></td>
                    <td><code>ComputedRef&lt;Object&gt;</code></td>
                    <td>CSS classes to apply based on RTL status</td>
                  </tr>
                  <tr>
                    <td><code>flipProperty(ltr, rtl)</code></td>
                    <td><code>Function</code></td>
                    <td>Returns the appropriate value based on direction</td>
                  </tr>
                  <tr>
                    <td><code>getTransform(shouldFlip)</code></td>
                    <td><code>Function</code></td>
                    <td>Gets transform style for flipping elements in RTL</td>
                  </tr>
                  <tr>
                    <td><code>applyRTLClass(baseClass)</code></td>
                    <td><code>Function</code></td>
                    <td>Apply an RTL-specific class variant if needed</td>
                  </tr>
                  <tr>
                    <td><code>getOrder(ltrOrder, rtlOrder)</code></td>
                    <td><code>Function</code></td>
                    <td>Get appropriate order value based on direction</td>
                  </tr>
                </tbody>
              </v-table>
              
              <div class="mt-5">
                <h4 class="text-h5 mb-3">Global Access:</h4>
                <p class="text-body-1">
                  RTL utilities are globally available via the <code>$rtl</code> property in your templates.
                  You can also access them from the Nuxt App instance with <code>useNuxtApp().$rtl</code>.
                </p>
              </div>
            </v-card-text>
          </v-card>
        </div>
        
        <!-- CSS Classes -->
        <div id="css-classes" class="mt-10">
          <GlobalsIntro
            title="CSS Classes"
            subtitle="Ready-to-use CSS utility classes for RTL"
          />
          
          <v-card class="mb-5">
            <v-card-text>
              <p class="text-body-1">
                The RTL system provides several utility classes that can be applied directly in your templates:
              </p>
              
              <v-table class="mt-4">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>rtl-flip</code></td>
                    <td>Flips the element horizontally in RTL mode</td>
                  </tr>
                  <tr>
                    <td><code>rtl-text-right</code></td>
                    <td>Forces text to be right-aligned in RTL mode</td>
                  </tr>
                  <tr>
                    <td><code>rtl-text-left</code></td>
                    <td>Forces text to be left-aligned in RTL mode</td>
                  </tr>
                  <tr>
                    <td><code>rtl-reverse</code></td>
                    <td>Reverses flex direction in RTL mode</td>
                  </tr>
                  <tr>
                    <td><code>arabic-text</code></td>
                    <td>Applies Arabic-friendly font families</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </div>
        
        <!-- Vuetify Support -->
        <div id="vuetify-support" class="mt-10">
          <GlobalsIntro
            title="Vuetify Support"
            subtitle="How RTL works with Vuetify components"
          />
          
          <v-card class="mb-5">
            <v-card-text>
              <p class="text-body-1">
                The RTL system is fully compatible with Vuetify components. Many components automatically adapt to RTL mode without extra work. 
                The system includes specific fixes for:
              </p>
              
              <ul class="mt-3">
                <li class="text-body-1 mb-2">Input fields and text areas</li>
                <li class="text-body-1 mb-2">Buttons with prepend/append slots</li>
                <li class="text-body-1 mb-2">Lists and list items</li>
                <li class="text-body-1 mb-2">Cards and layout components</li>
                <li class="text-body-1 mb-2">Dialog and menu positioning</li>
              </ul>
              
              <p class="text-body-1 mt-5">
                The RTL system overrides Vuetify's spacing and positioning classes to work correctly in RTL mode. This includes:
              </p>
              
              <ul class="mt-3">
                <li class="text-body-1 mb-2"><code>ms-*</code> and <code>me-*</code> margin classes</li>
                <li class="text-body-1 mb-2"><code>ps-*</code> and <code>pe-*</code> padding classes</li>
                <li class="text-body-1 mb-2"><code>text-left</code> and <code>text-right</code> alignment classes</li>
                <li class="text-body-1 mb-2">Border and rounded corner classes</li>
              </ul>
            </v-card-text>
          </v-card>
        </div>
        
        <!-- Best Practices -->
        <div id="best-practices" class="mt-10">
          <GlobalsIntro
            title="Best Practices"
            subtitle="Recommendations for working with RTL"
          />
          
          <v-card class="mb-10">
            <v-card-text>
              <p class="text-body-1">
                When working with RTL support, follow these best practices:
              </p>
              
              <ol class="mt-3">
                <li class="text-body-1 mb-3">
                  <strong>Use GlobalsTextField and other global components</strong> - These automatically handle RTL text alignment.
                </li>
                
                <li class="text-body-1 mb-3">
                  <strong>Prefer composables over inline styles</strong> - Use the <code>useRTL()</code> composable instead of 
                  writing your own RTL detection logic.
                </li>
                
                <li class="text-body-1 mb-3">
                  <strong>Use flexbox with <code>layoutDirection</code></strong> - Avoid absolute positioning when possible.
                </li>
                
                <li class="text-body-1 mb-3">
                  <strong>Test in both LTR and RTL modes</strong> - Always verify your UI in both directions.
                </li>
                
                <li class="text-body-1 mb-3">
                  <strong>Use <code>flipProperty()</code> for directional values</strong> - Instead of conditionals in your template.
                </li>
                
                <li class="text-body-1 mb-3">
                  <strong>Leverage the global CSS variables and classes</strong> - Add your specific overrides to <code>_rtl.scss</code>.
                </li>
              </ol>
            </v-card-text>
          </v-card>
        </div>
      </v-col>
      
      <v-col lg="3" class="d-none d-lg-block">
        <GlobalsContentList :list="contantList" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Add any additional scoped styles here */
</style> 