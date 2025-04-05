export default defineNuxtPlugin((nuxtApp) => {
  // Check if window is available (client-side)
  if (process.client) {
    // Get the Google Client ID from environment variables
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // If no valid Client ID is found, log a warning but don't break the app
    if (!googleClientId || googleClientId === 'your_actual_google_client_id') {
      console.warn('Google Sign-In initialization skipped: No valid Google Client ID found in environment variables. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      
      // Return a dummy implementation
      return {
        provide: {
          googleLogin: () => Promise.resolve({ 
            success: false, 
            error: 'Google login is not configured. Please contact the administrator.' 
          })
        }
      };
    }
    
    // Initialize Google Sign-In
    const initGoogleSignIn = () => {
      // Load the Google Sign-In API script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      // Initialize once the script is loaded
      script.onload = () => {
        console.log('Google Sign-In API loaded');
      };
    };
    
    // Call the init function
    initGoogleSignIn();
    
    // Provide a method to handle Google login
    return {
      provide: {
        googleLogin: () => {
          return new Promise((resolve, reject) => {
            try {
              // Create a new instance of the Google Identity Services client
              const client = google.accounts.oauth2.initTokenClient({
                client_id: googleClientId,
                scope: 'profile email',
                callback: (response) => {
                  if (response.access_token) {
                    // Exchange the access token for an ID token
                    fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${response.access_token}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.error) {
                          console.error('Google token validation error:', data.error);
                          resolve({ 
                            success: false, 
                            error: 'Failed to validate Google credentials' 
                          });
                        } else {
                          // We need to send the ID token to our backend
                          console.log('Google login successful');
                          resolve({
                            success: true,
                            idToken: data.sub, // Using sub as ID token for this example
                            accessToken: response.access_token
                          });
                        }
                      })
                      .catch(error => {
                        console.error('Google token validation error:', error);
                        resolve({ 
                          success: false, 
                          error: 'Failed to validate Google credentials' 
                        });
                      });
                  } else {
                    console.log('Google login failed or was cancelled');
                    resolve({ 
                      success: false, 
                      error: 'Google login was cancelled or failed' 
                    });
                  }
                },
                error_callback: (error) => {
                  console.error('Google Sign-In error:', error);
                  resolve({
                    success: false,
                    error: 'Google login failed'
                  });
                }
              });
              
              // Request the token
              client.requestAccessToken();
            } catch (error) {
              console.error('Google Sign-In initialization error:', error);
              resolve({
                success: false,
                error: 'Failed to initialize Google login'
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
      googleLogin: () => Promise.resolve({ success: false, error: 'Not available on server' })
    }
  };
}); 