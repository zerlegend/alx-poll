# Maintaining Your ALX Poll Rule File

As your project evolves, it's important to keep your `.trae-rules.json` file updated to ensure AI assistants can continue to provide accurate and consistent help. This document explains when and how to update your rule file.

## When to Update the Rule File

1. **New Features**: When adding new major features or components to the application
2. **Changed Patterns**: When changing coding patterns or conventions
3. **New Dependencies**: When adding significant new libraries or tools
4. **Refactoring**: After major refactoring that changes the project structure
5. **New API Endpoints**: When adding new API endpoints or changing existing ones

## How to Update the Rule File

### Adding New Routes

When adding new routes to your application, update the `structure.app.routes` section:

```json
{
  "path": "/app/polls/analytics",
  "description": "Analytics dashboard for poll insights"
}
```

### Adding New Components

When creating reusable components, document them in the appropriate section:

```json
"components": {
  "description": "Reusable UI components",
  "ui": "UI components from shadcn/ui library",
  "custom": "Custom components specific to the application",
  "analytics": "Components for data visualization and analytics"
}
```

### Updating Form Patterns

When changing form validation or submission patterns:

```json
"forms": {
  "validation": "Zod schema validation with custom error messages",
  "submission": "Use react-hook-form's handleSubmit with async validation",
  "errors": "Display form errors using FormMessage component with custom styling"
}
```

### Adding Database Tables

When adding new database tables or changing the schema:

```json
"database": {
  "provider": "Supabase",
  "tables": ["users", "polls", "options", "votes", "analytics", "comments"]
}
```

## Testing Your Updated Rule File

After updating your rule file, test it by asking an AI assistant to:

1. **Explain a pattern**: "Explain how form validation works in this project"
2. **Generate code**: "Create a new component following our project patterns"
3. **Refactor code**: "Refactor this component to follow our conventions"

If the AI's responses align with your expectations, your rule file is working correctly.

## Best Practices

1. **Be specific**: Provide detailed descriptions and examples
2. **Keep it updated**: Review and update the rule file regularly
3. **Document edge cases**: Include special cases and exceptions
4. **Include examples**: Add example code snippets for complex patterns
5. **Organize logically**: Group related rules and patterns together

## Example: Adding a New Feature

When adding a new feature like "Poll Comments", you would:

1. Add the new routes to `structure.app.routes`
2. Add any new components to `components`
3. Add the new database table to `database.tables`
4. Add any new API endpoints to `patterns.api`
5. Document any new form patterns in `patterns.forms`
6. Add code generation examples in `codeGeneration`

By keeping your rule file updated, you ensure that AI assistants can continue to provide valuable assistance that aligns with your project's evolving structure and conventions.