# ALX Poll - AI Assistant Rules

This document explains the `.trae-rules.json` file and how it helps AI assistants understand and work with the ALX Poll project.

## Purpose

The rule file provides structured information about the project's:
- Architecture and folder structure
- Code patterns and conventions
- Authentication and form handling
- Database schema and API endpoints

This helps AI assistants generate more accurate and consistent code that follows the project's established patterns.

## How to Use with AI Assistants

When working with AI assistants like Trae AI, Claude, or GitHub Copilot, you can:

1. **Reference the rule file**: "Please follow the patterns in the .trae-rules.json file when generating code."

2. **Specify patterns**: "Create a new poll form following our form conventions in .trae-rules.json."

3. **Scaffold components**: "Generate a new protected route component for viewing poll results using our project patterns."

## Example Prompts

### Creating a New Poll Form

```
Create a form component for submitting a new poll following our project conventions. 
The form should include all fields specified in the codeGeneration.newPoll.form section of our rules file.
Use react-hook-form with zod validation and shadcn/ui components.
```

### Adding a New API Route

```
Create an API route for fetching poll results. Follow our Supabase integration pattern and ensure it's protected for authenticated users only.
```

### Extending the Navigation

```
Update the Navigation component to include a dropdown menu for user settings. Follow our UI component patterns and authentication state handling.
```

## Updating the Rules

As the project evolves, update the `.trae-rules.json` file to reflect new patterns, components, or conventions. This ensures AI assistants always have the most current information about your project structure and expectations.