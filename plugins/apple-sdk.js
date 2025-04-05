export default defineNuxtPlugin((nuxtApp) => {
  // Check if window is available (client-side)
  if (process.client) {
    // Get the Apple Client ID and Redirect URI from environment variables
    const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;
    const appleRedirectUri = import.meta.env.VITE_APPLE_REDIRECT_URI;
    
    // If no valid Client ID is found, log a warning but don't break the app
    if (!appleClientId || appleClientId === 'your_actual_apple_client_id') {
      console.warn('Apple Sign-In initialization skipped: No valid Apple Client ID found in environment variables. Please set VITE_APPLE_CLIENT_ID in your .env file.');
      
      // Return a dummy implementation
      return {
        provide: {
          appleLogin: () => Promise.resolve({ 
            success: false, 
            error: 'Apple login is not configured. Please contact the administrator.' 
          })
        }
      };
    }
    
    // Initialize Apple Sign-In
    const initAppleSignIn = () => {
      // Load the Apple Sign-In API script
      const script = document.createElement('script');
      script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      // Initialize once the script is loaded
      script.onload = () => {
        // Configure Apple Sign-In
        AppleID.auth.init({
          clientId: appleClientId,
          scope: 'name email',
          redirectURI: appleRedirectUri || window.location.origin,
          usePopup: true
        });
      };
    };
    
    // Call the init function
    initAppleSignIn();
    
    // Provide a method to handle Apple login
    return {
      provide: {
        appleLogin: () => {
          return new Promise((resolve, reject) => {
            try {
              // Check if AppleID is available
              if (typeof AppleID === 'undefined') {
                console.error('Apple Sign-In API not loaded yet');
                resolve({
                  success: false,
                  error: 'Apple login is not ready yet. Please try again.'
                });
                return;
              }
              
              // Try to authenticate with Apple
              AppleID.auth.signIn()
                .then((response) => {
                  // For Apple, we get an authorization object with id_token
                  if (response.authorization && response.authorization.id_token) {
                    resolve({
                      success: true,
                      idToken: response.authorization.id_token,
                      user: response.user || {}
                    });
                  } else {
                    console.error('Apple login response missing id_token');
                    resolve({
                      success: false,
                      error: 'Failed to get authentication token from Apple'
                    });
                  }
                })
                .catch((error) => {
                  console.error('Apple Sign-In error:', error);
                  resolve({
                    success: false,
                    error: 'Apple login failed or was cancelled'
                  });
                });
            } catch (error) {
              console.error('Apple Sign-In initialization error:', error);
              resolve({
                success: false,
                error: 'Failed to initialize Apple login'
              });
            }
          });
        }
      }
    };
  }
  
  // Return empty provide for SSR
  return {
    provide: {
      appleLogin: () => Promise.resolve({ success: false, error: 'Not available on server' })
    }
  };
}); 