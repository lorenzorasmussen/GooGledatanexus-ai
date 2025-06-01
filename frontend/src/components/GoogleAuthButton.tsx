import React, { useEffect } from 'react';

interface GoogleAuthButtonProps {
  onSuccess: (credentialResponse: any) => void;
  onFailure: () => void;
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onFailure }) => {
  useEffect(() => {
    // Ensure the Google Identity Services library is loaded
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(
        document.getElementById("google-sign-in-button"),
        { theme: "outline", size: "large" } // Customization options
      );
    }
  }, []);

  const handleCredentialResponse = async (response: any) => {
    if (response.credential) {
      try {
        const backendResponse = await fetch('/api/verify-google-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await backendResponse.json();

        if (data.success) {
          onSuccess(data.user); // Pass the user payload from the backend
        } else {
          console.error('Backend verification failed:', data.message);
          onFailure();
        }
      } catch (error) {
        console.error('Error sending credential to backend:', error);
        onFailure();
      }
    } else {
      onFailure();
    }
  };

  return (
    <div id="google-sign-in-button"></div>
  );
};

export default GoogleAuthButton;