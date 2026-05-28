---
name: "sanity-integration"
description: "Integrate Sanity CMS into React, Next.js, or Vite projects with complete setup including client configuration, schemas, form integrations, and Studio setup. Use when user asks to add Sanity, set up a CMS, integrate content management, or save form data to Sanity."
---

# Sanity CMS Integration Skill

## When to Use This Skill

- User asks to integrate Sanity CMS into their project
- User wants to set up a headless CMS
- User needs to save form data (contact forms, leads, etc.) to a backend
- User mentions "Sanity", "CMS", "content management", or "headless CMS"
- User wants to manage dynamic content (properties, blog posts, products, etc.)

## Procedure

### 1. Verify Project Setup
- Check if project is React, Next.js, or Vite-based
- Verify environment variables file exists (.env or .env.local)
- Confirm user has Sanity account credentials (projectId, dataset, token)

### 2. Install Sanity Client Packages
```bash
npm install @sanity/client @sanity/image-url
```

### 3. Create Sanity Client Configuration
Create `src/lib/sanity.ts` (or appropriate path):
- Import createClient from @sanity/client
- Configure with environment variables
- Use `import.meta.env` for Vite or `process.env` for Next.js
- Set useCdn to false for write operations
- Include token for authenticated requests

### 4. Create Helper Functions
In the same sanity.ts file, add:
- Submit functions for forms (e.g., submitLead, submitContact)
- Fetch functions for content (e.g., fetchProperties, fetchPosts)
- Use GROQ queries for fetching data
- Include proper TypeScript types

### 5. Set Up Sanity Studio
Create `sanity-studio/` directory with:
- `package.json` with Sanity dependencies
- `sanity.config.ts` with project configuration
- `sanity.cli.ts` for CLI configuration
- `tsconfig.json` for TypeScript
- `.gitignore` for node_modules and build files

### 6. Create Schemas
In `sanity-studio/schemaTypes/`:
- Create schema files for each content type (lead.ts, property.ts, etc.)
- Use defineType and defineField from Sanity
- Include validation rules
- Add preview configurations
- Export all schemas in index.ts

### 7. Update Forms/Components
- Import Sanity helper functions
- Add form state management (useState)
- Create submit handlers with try/catch
- Add loading states and success/error notifications
- Reset form after successful submission

### 8. Install Studio Dependencies
```bash
cd sanity-studio
npm install
```

### 9. Provide Setup Instructions
Create documentation with:
- How to start both servers
- CORS configuration steps
- Testing procedures
- Troubleshooting common issues

## Schema Structure Template

### Basic Content Schema
```typescript
import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'contentType',
  title: 'Content Type',
  type: 'document',
  fields: [
    defineField({
      name: 'fieldName',
      title: 'Field Title',
      type: 'string', // or number, text, image, array, etc.
      validation: (Rule) => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'fieldName',
      subtitle: 'anotherField'
    }
  }
})
```

### Form Submission Schema
Include:
- User input fields (name, email, phone, message)
- Status field with options (new, contacted, qualified, closed)
- Timestamp field with auto-initialization
- Validation for required fields and email format

### Content Management Schema
Include:
- Title and description fields
- Rich content fields (text, images, arrays)
- Status/category fields with predefined options
- Media fields with hotspot support
- SEO-related fields if needed

## Output Format

### 1. File Structure
```
project-root/
├── src/
│   └── lib/
│       └── sanity.ts          # Client configuration
├── sanity-studio/
│   ├── schemaTypes/
│   │   ├── index.ts
│   │   ├── [content-type].ts
│   │   └── ...
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   ├── package.json
│   └── tsconfig.json
├── .env                        # Environment variables
└── [INTEGRATION_GUIDE].md      # Documentation
```

### 2. Environment Variables
```
VITE_SANITY_PROJECT_ID=your_project_id
VITE_SANITY_DATASET=production
VITE_SANITY_TOKEN=your_token
```

### 3. Documentation
Create comprehensive guide including:
- Setup steps
- Server start commands
- CORS configuration instructions
- Testing procedures
- Troubleshooting section
- API reference for helper functions

## Quality Criteria

### Code Quality
- ✓ TypeScript types properly defined
- ✓ Environment variables used (never hardcode credentials)
- ✓ Error handling with try/catch blocks
- ✓ Loading states for async operations
- ✓ Form validation and user feedback

### Schema Quality
- ✓ Validation rules on required fields
- ✓ Appropriate field types for data
- ✓ Preview configurations for better UX
- ✓ Logical field organization
- ✓ Clear titles and descriptions

### Integration Quality
- ✓ Forms properly connected to Sanity
- ✓ Success/error notifications implemented
- ✓ Form resets after successful submission
- ✓ Proper state management
- ✓ No console errors

### Documentation Quality
- ✓ Clear step-by-step instructions
- ✓ CORS setup prominently featured
- ✓ Both development and production considerations
- ✓ Troubleshooting section included
- ✓ Code examples provided

## Common Pitfalls to Avoid

1. **Missing CORS Configuration**: Always remind user to add CORS origins in Sanity dashboard
2. **Wrong Environment Variable Format**: Use VITE_ prefix for Vite, NEXT_PUBLIC_ for Next.js
3. **Missing Dependencies**: Install both @sanity/client and @sanity/image-url
4. **Token Permissions**: Ensure token has write permissions (Editor or Admin)
5. **Version Conflicts**: Match styled-components version to Sanity requirements
6. **Missing @sanity/vision**: Include in Studio dependencies for GROQ testing

## Example Implementation

### Input
"I need to integrate Sanity CMS into my React real estate app. I want to save contact form submissions and manage property listings."

### Output

**Step 1: Install Packages**
```bash
npm install @sanity/client @sanity/image-url
```

**Step 2: Create Sanity Client** (`src/lib/sanity.ts`)
```typescript
import { createClient } from "@sanity/client";

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET,
  apiVersion: "2024-02-28",
  useCdn: false,
  token: import.meta.env.VITE_SANITY_TOKEN
});

export async function submitLead(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  return await sanityClient.create({
    _type: "lead",
    ...data,
    submittedAt: new Date().toISOString(),
    status: "new"
  });
}
```

**Step 3: Create Schemas**
- Lead schema with contact form fields
- Property schema with listing details
- Both with proper validation and previews

**Step 4: Set Up Studio**
- Complete sanity-studio folder structure
- Install dependencies
- Configure with project credentials

**Step 5: Update Contact Form**
- Add state management
- Integrate submitLead function
- Add success/error notifications

**Step 6: Documentation**
- Create setup guide
- Include CORS configuration steps
- Provide testing instructions

## Integration Checklist

Before marking integration complete, verify:

- [ ] Sanity client packages installed
- [ ] Client configuration created with env variables
- [ ] Helper functions implemented
- [ ] Sanity Studio folder created
- [ ] All schemas defined and exported
- [ ] Studio dependencies installed
- [ ] Forms/components updated with Sanity integration
- [ ] Success/error notifications working
- [ ] Documentation created
- [ ] CORS configuration instructions provided
- [ ] Both servers can start without errors
- [ ] Test submission works end-to-end

## Advanced Features (Optional)

### Image Handling
```typescript
import imageUrlBuilder from '@sanity/image-url';

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: any) {
  return builder.image(source);
}
```

### Real-time Updates
```typescript
const subscription = sanityClient
  .listen('*[_type == "property"]')
  .subscribe(update => {
    console.log('Property updated:', update);
  });
```

### Drafts and Publishing
Add `_status` field to schemas for draft/published workflow.

## Related Skills

- **form-validation**: Use before Sanity integration for client-side validation
- **api-integration**: General API integration patterns apply
- **typescript-setup**: Ensure proper TypeScript configuration
- **env-management**: Secure environment variable handling

## Notes

- Always use environment variables for credentials
- CORS must be configured before testing
- Studio runs on port 3333 by default
- React app and Studio are separate servers
- Token needs write permissions for form submissions
- Use `useCdn: false` for write operations
- Use `useCdn: true` for read-only public data
