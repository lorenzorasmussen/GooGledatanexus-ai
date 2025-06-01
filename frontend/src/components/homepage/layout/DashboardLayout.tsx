import React, { useState } from 'react';
import GoogleAuthButton from '../../GoogleAuthButton';

const HomeView: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);

  const handleAuthSuccess = (response: any) => {
    console.log('Google Auth Success:', response);
    // You would typically send the credential to your backend for verification
    // For now, let's just extract and display the user's name if available
    try {
      const profile = JSON.parse(atob(response.credential.split('.')[1]));
      setUserName(profile.name);
    } catch (e) {
      console.error("Error parsing credential", e);
      setUserName("User");
    }
  };

  const handleAuthFailure = () => {
    console.error('Google Auth Failed');
    setUserName(null);
  };

  return (
    <div className="welcome-hub">
      <h1>Welcome to DataNexus!</h1>
      <p>Your personalized hub for productivity and insights.</p>
      {!userName ? (
        <>
          <p>Please sign in with your Google account to get started:</p>
          <GoogleAuthButton onSuccess={handleAuthSuccess} onFailure={handleAuthFailure} />
        </>
      ) : (
        <h2>Hello, {userName}!</h2>
      )}
      {/* Add more personalized content here */}
    </div>
  );
};

export default HomeView;