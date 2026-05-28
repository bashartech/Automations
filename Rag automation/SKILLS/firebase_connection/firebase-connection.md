---
name: "firebase-connection"
description: "Set up Firebase connection for React/TypeScript applications with proper configuration, environment variables, and authentication services. Use when user needs to connect their app to Firebase for database, authentication, or storage services."
---

# Firebase Connection Setup Skill

## When to Use This Skill
- User wants to connect their React/TypeScript application to Firebase
- User needs to set up Firebase authentication, Firestore, or other services
- User asks about Firebase configuration, environment variables, or initialization
- User needs guidance on how data flows between their app and Firebase

## Prerequisites
- Firebase project created in Firebase Console
- Access to Firebase project configuration details
- Understanding of environment variables for security

## Procedure
1. **Identify Required Firebase Services**: Determine which Firebase services are needed (Authentication, Firestore, Storage, etc.)
2. **Gather Firebase Configuration**: Collect the necessary configuration values from Firebase Console
3. **Set Up Environment Variables**: Configure environment variables securely
4. **Create Firebase Initialization File**: Set up the main Firebase configuration file
5. **Implement Service Connections**: Connect to specific Firebase services as needed
6. **Test Connection**: Verify the connection works properly

## Required Environment Variables
The following environment variables must be configured in the application:

```
REACT_APP_API_KEY=your_firebase_api_key
REACT_APP_AUTH_DOMAIN=your_project_auth_domain.firebaseapp.com
REACT_APP_PROJECT_ID=your_firebase_project_id
REACT_APP_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_APP_ID=your_firebase_app_id
```

## Firebase Configuration File Structure
Create a `firebase.ts` file with the following structure:

```typescript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY!,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN!,
  projectId: process.env.REACT_APP_PROJECT_ID!,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET!,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID!,
  appId: process.env.REACT_APP_APP_ID!
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Export specific functions for use
export {
  app,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp
};
```

## Data Flow Process
1. **Client Initialization**: App loads Firebase configuration from environment variables
2. **Service Connection**: Establishes connections to Firebase services (Auth, Firestore, etc.)
3. **Authentication**: User credentials validated through Firebase Authentication
4. **Data Operations**: CRUD operations performed on Firestore collections/documents
5. **Real-time Updates**: Listeners provide real-time data synchronization
6. **Security Rules**: Firebase Security Rules validate access and data integrity

## Best Practices
- Never expose Firebase configuration publicly in client code
- Use environment variables for sensitive configuration values
- Implement proper Firebase Security Rules for data protection
- Handle authentication state changes properly
- Use TypeScript interfaces for data validation
- Implement proper error handling for Firebase operations
- Follow Firebase best practices for data modeling

## Security Considerations
- Enable email verification for user accounts
- Set up Firebase Security Rules to restrict unauthorized access
- Never hardcode API keys or sensitive values in source code
- Use Firebase Authentication for user management
- Implement rate limiting and validation on the server side

## Example Usage
After setting up Firebase connection, you can use it in your components like this:

```typescript
import { useAuth } from './contexts/AuthContext';
import { firestore } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

function MyComponent() {
  const { currentUser } = useAuth();

  const saveData = async () => {
    if (currentUser) {
      await addDoc(collection(firestore, 'users'), {
        userId: currentUser.uid,
        data: 'some data',
        timestamp: serverTimestamp()
      });
    }
  };

  return <button onClick={saveData}>Save Data</button>;
}
```

## Troubleshooting
- If getting "Missing or insufficient permissions" error, check Firebase Security Rules
- If environment variables aren't loading, ensure they start with REACT_APP_
- For authentication issues, verify authDomain and API key are correct
- For Firestore access issues, check project ID and region settings

## Output Format
- Environment variables template for .env files
- Firebase configuration file with exports
- Security rules recommendations
- Example usage patterns
- Troubleshooting guide