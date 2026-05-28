# Sanity Integration Skill - Usage Guide

## ✅ Skill Created Successfully

**Location:** `.claude/skills/sanity-integration/SKILL.md`

**Skill Name:** `sanity-integration`

**Purpose:** Automates complete Sanity CMS integration into React, Next.js, or Vite projects

## 🎯 What This Skill Does

The skill encodes the entire Sanity integration workflow you just experienced:

1. **Installs Dependencies** - @sanity/client and @sanity/image-url
2. **Creates Client Configuration** - Sets up sanity.ts with environment variables
3. **Builds Helper Functions** - Submit and fetch functions with TypeScript
4. **Sets Up Sanity Studio** - Complete folder structure with schemas
5. **Creates Schemas** - Lead, property, or custom content types
6. **Updates Forms** - Integrates Sanity into React components
7. **Generates Documentation** - Setup guides and troubleshooting

## 🚀 How to Use This Skill

### Activation Triggers

The skill activates when you ask Claude:

- "Integrate Sanity CMS into my project"
- "Set up a headless CMS"
- "Add Sanity to save form data"
- "I need content management for my app"
- "Help me set up Sanity Studio"

### Example Usage

**In a new project:**
```
I'm building a blog with React and Vite.
I need to integrate Sanity CMS to manage blog posts and authors.
```

**For form submissions:**
```
I have a contact form in my Next.js app.
I want to save submissions to Sanity CMS.
```

**For e-commerce:**
```
I'm building an online store with React.
Integrate Sanity to manage products, categories, and inventory.
```

### What Claude Will Do

When the skill activates, Claude will:

1. ✓ Check your project type (React/Next.js/Vite)
2. ✓ Verify you have Sanity credentials
3. ✓ Install required packages
4. ✓ Create client configuration
5. ✓ Set up Sanity Studio with schemas
6. ✓ Update your forms/components
7. ✓ Generate complete documentation
8. ✓ Provide CORS setup instructions
9. ✓ Create testing procedures

## 📋 Skill Features

### Comprehensive Coverage
- ✓ Multiple project types (React, Next.js, Vite)
- ✓ Form integrations (contact, leads, submissions)
- ✓ Content management (properties, blog posts, products)
- ✓ Image handling with @sanity/image-url
- ✓ TypeScript support throughout

### Quality Assurance
- ✓ Environment variable security
- ✓ Error handling patterns
- ✓ Loading states and notifications
- ✓ Form validation
- ✓ CORS configuration guidance

### Documentation
- ✓ Step-by-step setup guides
- ✓ Troubleshooting sections
- ✓ Code examples
- ✓ Testing procedures
- ✓ API reference

## 🧪 Testing the Skill

### Method 1: Start Fresh Session
```bash
# Exit current Claude session
exit

# Start new session (skill will auto-load)
claude

# Test the skill
"I need to integrate Sanity CMS into my React app for managing blog posts"
```

### Method 2: Verify Skill Loading
```bash
claude

# Ask Claude directly
"What skills do you have available? Do you see the sanity-integration skill?"
```

### Method 3: Use in Another Project
```bash
cd /path/to/another-project
claude

"Add Sanity CMS to save contact form submissions"
```

## 📚 Skill Structure (Following details.md Pattern)

### ✓ YAML Frontmatter
- Clear name and description
- Activation triggers specified
- Context-aware description

### ✓ When to Use Section
- Specific use cases listed
- Trigger keywords identified
- Clear activation conditions

### ✓ Procedure Section
- Step-by-step workflow
- Numbered instructions
- Clear action items

### ✓ Output Format Section
- File structure templates
- Code examples
- Documentation format

### ✓ Quality Criteria Section
- Code quality checks
- Schema quality standards
- Integration verification
- Documentation requirements

### ✓ Example Implementation
- Real-world scenario
- Complete input/output
- Practical demonstration

### ✓ Checklist
- Verification steps
- Completion criteria
- Quality gates

## 🎓 Skill Benefits

### For You
- **Reusable**: Use in any future project needing Sanity
- **Consistent**: Same quality integration every time
- **Fast**: Minutes instead of hours
- **Documented**: Always includes setup guides

### For Your Team
- **Shareable**: Team members can use the same skill
- **Standardized**: Everyone follows same patterns
- **Onboarding**: New developers get instant guidance
- **Knowledge Base**: Encoded expertise

### For Future Projects
- **Portfolio**: Skill works across all project types
- **Scalable**: Handles simple to complex integrations
- **Maintainable**: Easy to update as Sanity evolves
- **Extensible**: Add advanced features as needed

## 🔄 Updating the Skill

As you learn more about Sanity or your needs change:

```bash
claude

"Review my sanity-integration skill. I want to add:
1. Real-time subscription support
2. Draft/publish workflow
3. Multi-language content support

Update the skill with these features."
```

## 🌟 Next Steps

### 1. Test the Skill
Try it in a new project to verify it works as expected.

### 2. Refine Based on Usage
After using it 2-3 times, note what works and what doesn't.

### 3. Create Related Skills
Consider creating complementary skills:
- `form-validation` - Client-side validation before Sanity
- `cms-content-modeling` - Design content schemas
- `sanity-deployment` - Deploy Studio to production

### 4. Share with Team
If working in a team, share the skill so everyone benefits.

## 📖 Related Documentation

- **SANITY_INTEGRATION.md** - Technical integration details
- **QUICK_START.md** - Quick reference guide
- **IMPLEMENTATION_SUMMARY.md** - What was implemented

## ✨ Success!

You now have a reusable, professional-grade skill that encodes your Sanity integration expertise. Every time you or your team needs to integrate Sanity CMS, Claude will follow this exact workflow automatically.

**The skill is ready to use in any Claude Code session!**
