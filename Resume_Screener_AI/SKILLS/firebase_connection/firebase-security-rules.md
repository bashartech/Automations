---
name: "firebase-security-rules"
description: "Set up and manage Firebase Security Rules for Firestore and Storage to ensure proper access control and data validation. Use when user needs to implement security rules for their Firebase project."
---

# Firebase Security Rules Setup Skill

## When to Use This Skill
- User needs to set up Firestore Security Rules for their database
- User wants to implement proper access control for their data
- User asks about securing Firebase Storage or Firestore
- User needs to validate data before it's stored in Firebase
- User wants to understand authentication-based access control

## Security Rules Overview
Firebase Security Rules provide a declarative way to secure your data. They control who can read and write to your Cloud Firestore database, Firebase Storage, and Realtime Database.

## Firestore Security Rules Structure

### Basic Rule Syntax
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules go here
  }
}
```

### Common Security Patterns

#### 1. User Authentication Check
```
match /databases/{database}/documents {
  match /users/{document} {
    allow read, write: if request.auth != null;
  }
}
```

#### 2. User-Specific Data Access
```
match /databases/{database}/documents {
  match /users/{document} {
    allow read, write: if request.auth != null && request.auth.uid == document;
  }
}
```

#### 3. Role-Based Access Control
```
match /databases/{database}/documents {
  match /admin-content/{document} {
    allow read, write: if request.auth.token.admin == true;
  }
}
```

#### 4. Data Validation Rules
```
match /databases/{database}/documents {
  match /posts/{document} {
    allow create: if request.auth != null
                 && request.resource.data.size() <= 3
                 && request.resource.data.keys().hasAll(['title', 'content', 'author'])
                 && request.resource.data.author == request.auth.uid;
  }
}
```

## Complete Security Rules Example

### firestore.rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Anyone can read events, but only the creator can write
    match /events/{document} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.size() <= 10
                    && request.resource.data.keys().hasAll(['title', 'description', 'date', 'location', 'createdBy'])
                    && request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null && request.auth.uid == resource.data.createdBy;
      allow delete: if request.auth != null && request.auth.uid == resource.data.createdBy;

      // RSVP subcollection - users can only modify their own RSVP
      match /rsvps/{rsvpId} {
        allow read: if request.auth != null;
        allow create, update: if request.auth != null && request.auth.uid == rsvpId;
        allow delete: if request.auth != null && request.auth.uid == rsvpId;
      }
    }

    // Allow authenticated users to read public data
    match /public/{document} {
      allow read: if request.auth != null;
    }
  }
}
```

## Storage Security Rules Example

### storage.rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }

  // Specific folder for user uploads
  match /b/{bucket}/o/users/{userId}/{allPaths=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

## Deploying Security Rules

### Using Firebase CLI
1. Create your rules files (`firestore.rules` and/or `storage.rules`)
2. Run the following command to deploy:
```bash
firebase deploy --only firestore:rules
# or for storage
firebase deploy --only storage:rules
```

### Testing Rules Locally
Use the Firebase Emulator Suite to test your rules:
```bash
firebase emulators:start --only firestore
```

## Common Security Patterns

### 1. Time-based Restrictions
```
allow read: if request.time < timestamp(date(2024, 12, 31));
```

### 2. Field Validation
```
allow write: if request.resource.data.name.matches("^.{1,30}$");
```

### 3. Nested Data Validation
```
allow create: if request.resource.data.items.hasAny([true])
              && request.resource.data.items.size() <= 10;
```

### 4. Cross-document Validation
```
allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.active == true;
```

## Best Practices

### 1. Principle of Least Privilege
Start with restrictive rules and gradually grant access as needed.

### 2. Validate Input Data
Always validate data format, size, and content before allowing writes.

### 3. Use Built-in Functions
Leverage Firebase's built-in functions for common operations:
- `request.auth` - Authentication information
- `request.resource.data` - New data being written
- `resource.data` - Existing data being updated
- `get()` - Read other documents
- `exists()` - Check if a document exists

### 4. Organize by Collection
Group rules by collection and implement the most restrictive rules first.

### 5. Test Thoroughly
Test both authorized and unauthorized access scenarios.

## Troubleshooting Common Issues

### 1. Permission Denied Errors
- Check if user is authenticated
- Verify rule conditions match the data being accessed
- Ensure document paths are correct

### 2. Too Restrictive Rules
- Temporarily add logging to understand why rules fail
- Use emulator for testing before deploying

### 3. Performance Issues
- Minimize use of `get()` calls in frequently accessed rules
- Use indexed queries when possible

## Security Rule Testing Checklist
- [ ] Authenticated users can access allowed data
- [ ] Unauthenticated users are blocked appropriately
- [ ] Users cannot access other users' private data
- [ ] Data validation prevents malformed entries
- [ ] Write operations are properly restricted
- [ ] Rules work with your application's data model

## Output Format
- Security rules templates for common use cases
- Complete example rules files
- Deployment instructions
- Testing procedures
- Best practices guide
- Troubleshooting checklist