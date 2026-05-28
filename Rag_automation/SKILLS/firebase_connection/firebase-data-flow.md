---
name: "firebase-data-flow"
description: "Explain and implement data flow from web application to Firebase services including authentication, database operations, and real-time synchronization. Use when user needs to understand how data moves between their app and Firebase services."
---

# Firebase Data Flow Implementation Skill

## When to Use This Skill
- User wants to understand how data flows from their web application to Firebase
- User needs to implement data persistence using Firestore
- User asks about real-time data synchronization with Firebase
- User needs to set up authentication flow with Firebase Auth
- User wants to understand the complete data lifecycle in a Firebase-backed application

## Data Flow Overview
The typical data flow in a Firebase-connected application follows this pattern:

1. **User Interaction**: User performs an action in the web interface (form submission, button click, etc.)
2. **Client Validation**: Frontend validates data before sending to Firebase
3. **Firebase Request**: Client makes request to Firebase service (Auth, Firestore, etc.)
4. **Security Validation**: Firebase Security Rules validate the request
5. **Data Processing**: Firebase processes the request and stores/updates data
6. **Response/Notification**: Firebase sends response back to client
7. **UI Update**: Client updates user interface based on response

## Detailed Data Flow Steps

### 1. User Authentication Flow
```
Browser → Firebase Auth → Security Rules → Browser
```
- User enters credentials in web form
- Client sends credentials to Firebase Auth service
- Firebase validates credentials against stored data
- Returns authentication token if valid
- Client stores token and updates UI accordingly

### 2. Data Storage Flow
```
Browser → Client Validation → Firebase Firestore → Security Rules → Database → Response → Browser
```
- User submits data through web interface
- Client validates data format and required fields
- Client sends data to Firestore using appropriate methods
- Security Rules verify user has permission to write data
- Firestore stores data in specified collection/document
- Returns success/error response to client
- Client updates UI based on response

### 3. Real-time Data Sync Flow
```
Database → Firebase → Client Listener → UI Update
```
- Firestore detects data changes in real-time
- Firebase pushes updates to registered listeners
- Client receives data updates automatically
- UI updates reflect new data without refresh

## Required Files and Configuration

### Environment Variables (.env)
```
REACT_APP_API_KEY=your_firebase_api_key
REACT_APP_AUTH_DOMAIN=your_project_auth_domain
REACT_APP_PROJECT_ID=your_project_id
REACT_APP_STORAGE_BUCKET=your_storage_bucket
REACT_APP_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_APP_ID=your_app_id
```

### Main Firebase Configuration (src/firebase.ts)
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY!,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN!,
  projectId: process.env.REACT_APP_PROJECT_ID!,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET!,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID!,
  appId: process.env.REACT_APP_APP_ID!
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export { app };
```

### Authentication Context (src/contexts/AuthContext.tsx)
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { User } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Data Service Example (src/services/dataService.ts)
```typescript
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { firestore } from '../firebase';

export const saveData = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(firestore, collectionName), data);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const getData = async (collectionName: string, field?: string, operator?: any, value?: any) => {
  try {
    let q = query(collection(firestore, collectionName));

    if (field && operator && value !== undefined) {
      q = query(collection(firestore, collectionName), where(field, operator, value));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};
```

## Security Rules Considerations
Ensure your Firebase Security Rules properly protect your data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow users to read/write events they created
    match /events/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## Testing the Data Flow
1. **Authentication Test**: Verify user can sign up/login/logout
2. **Data Write Test**: Create sample data and verify it appears in Firestore
3. **Data Read Test**: Retrieve data and confirm it displays correctly
4. **Real-time Test**: Update data in Firebase console and verify UI updates
5. **Security Test**: Attempt unauthorized access and confirm rejection

## Common Issues and Solutions
- **Data not saving**: Check Firebase configuration and security rules
- **Authentication failures**: Verify authDomain and API key
- **Real-time updates not working**: Ensure listeners are properly unsubscribed
- **Permission denied**: Review and update security rules
- **Environment variables not loading**: Ensure variables start with REACT_APP_

## Best Practices
- Always validate data on both client and server sides
- Implement proper error handling for network requests
- Use TypeScript interfaces to define data structures
- Implement loading states for better UX
- Properly unsubscribe from listeners to prevent memory leaks
- Use transactions for complex operations affecting multiple documents

## Output Format
- Complete data flow explanation
- Required configuration files
- Sample implementation code
- Security rules recommendations
- Testing procedures
- Troubleshooting guide