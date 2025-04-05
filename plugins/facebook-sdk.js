export default defineNuxtPlugin((nuxtApp) => {
  // Check if window is available (client-side)
  if (process.client) {
    // Get the Facebook App ID from environment variables
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    
    // If no valid App ID is found, log a warning but don't break the app
    if (!fbAppId || fbAppId === 'your_actual_facebook_app_id') {
      console.warn('Facebook SDK initialization skipped: No valid Facebook App ID found in environment variables. Please set VITE_FACEBOOK_APP_ID in your .env file.');
      
      // Return a dummy implementation that will display an appropriate message
      return {
        provide: {
          fbLogin: () => Promise.resolve({ 
            success: false, 
            error: 'Facebook login is not configured. Please contact the administrator.' 
          })
        }
      };
    }
    
    // Facebook SDK initialization
    const initFacebookSDK = () => {
      // Load the Facebook SDK asynchronously
      window.fbAsyncInit = function() {
        FB.init({
          appId: fbAppId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'  // Use appropriate API version
        });
      };

      // Load the SDK
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    // Call the init function
    initFacebookSDK();

    // Provide a method to handle Facebook login
    return {
      provide: {
        fbLogin: () => {
          return new Promise((resolve, reject) => {
            // Only request public_profile by default
            // 'email' scope must be approved for your app in the Facebook Developer Dashboard
            FB.login(function(response) {
              if (response.authResponse) {
                // User authenticated and gave permissions
                resolve({
                  success: true,
                  accessToken: response.authResponse.accessToken
                });
              } else {
                // User cancelled or didn't authorize
                resolve({ 
                  success: false, 
                  error: 'Facebook login was cancelled or failed'
                });
              }
            }, { scope: 'public_profile' }); // Use only public_profile scope
          });
        }
      }
    };
  }
  
  // Return empty provide for SSR
  return {
    provide: {
      fbLogin: () => Promise.resolve({ success: false, error: 'Not available on server' })
    }
  };
}); 