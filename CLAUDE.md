# Share Money Frontend Standards

## Scope

- Work only inside `C:\GIT\FRONT-END\share_money_frontend`.
- Do not read, create, modify, move, or delete files outside this project unless the user explicitly grants permission.
- Follow the existing project structure and conventions when they are available.

## Code Style

- Do not write comments in source code.
- Write self-explanatory code with clear names and small, focused functions.
- Keep formatting consistent, clean, and easy to scan.
- Use the project's formatter and linter for every changed file.
- Avoid duplicated logic, magic values, deeply nested conditions, and oversized components.
- Keep files and modules focused on one responsibility.

## Shared and Common Code

- Extract reusable logic into shared utilities, hooks, services, components, methods, or classes.
- Reuse an existing shared implementation before creating a new one.
- Create shared abstractions only when behavior is genuinely reusable.
- Keep business rules separate from presentation components.
- Store shared constants, validation rules, types, and formatters in clearly named common modules.
- Keep feature-specific logic within its feature when it is not reusable.

## Input Validation and Security

- Every text input must define a maximum length.
- Use `50` characters as the default maximum length unless the business requirement specifies another value.
- Enforce the limit in both the UI input and the validation schema.
- Validate and normalize input before processing or submission.
- Reject unsupported special characters using an explicit allowlist appropriate to each field.
- Do not use one restrictive character rule for fields that legitimately require symbols, including email addresses, passwords, URLs, currency values, and formatted identifiers.
- Never render untrusted HTML or bypass framework escaping.
- Do not place secrets, tokens, credentials, or sensitive configuration in frontend code.
- Treat client-side validation as user experience and defense in depth; server-side validation remains required.
- Display validation errors consistently, clearly, and close to the relevant field.

## Input Pattern

- Use a shared input component for labels, required state, length limits, error messages, disabled state, and accessibility attributes.
- Use shared validation helpers or schemas instead of duplicating regular expressions and error messages.
- Apply validation consistently on change, blur, and submit according to the form's user experience.
- Prevent invalid submission and preserve valid user-entered data when validation fails.
- Trim unnecessary surrounding whitespace where the field permits it.

## Performance

- Avoid unnecessary renders, repeated requests, duplicate calculations, and oversized dependencies.
- Memoize only when measurement or component behavior justifies it.
- Debounce high-frequency search or filtering inputs when appropriate.
- Lazy-load large routes, screens, or optional modules when it improves initial loading.
- Paginate or virtualize large datasets.
- Optimize images and request only the data needed by the current screen.
- Clean up subscriptions, timers, event listeners, and pending asynchronous work.
- Preserve caching behavior and avoid premature optimization that increases complexity.

## UI and Design Pattern

- Design interfaces to be simple, attractive, consistent, and easy to understand.
- Use a shared design system for colors, spacing, typography, radii, shadows, and interaction states.
- Reuse common page layouts, cards, buttons, inputs, tables, dialogs, loading states, empty states, and error states.
- Every table that lists records must include pagination, with a default page size of `5` unless the feature specifies otherwise.
- Maintain a clear visual hierarchy with restrained color usage and predictable spacing.
- Support responsive layouts for mobile, tablet, and desktop.
- Provide visible hover, focus, active, disabled, loading, success, and error states.
- Meet accessibility requirements for semantic structure, keyboard navigation, focus visibility, labels, contrast, and screen readers.
- Prefer concise screens and progressive disclosure over showing every option at once.

## Implementation Workflow

- Inspect relevant existing code before making changes.
- Confirm that new work follows existing patterns and does not duplicate shared functionality.
- Keep changes scoped to the requested feature.
- Format and lint changed code.
- Run relevant tests and build checks after implementation.
- Review input validation, security, accessibility, responsiveness, and performance before completion.
- Do not leave debug output, dead code, unused imports, or temporary files.

## Definition of Done

- The requested behavior works as specified.
- Code is formatted, readable, reusable where appropriate, and contains no source-code comments.
- Inputs have suitable validation and a default maximum length of `50` where applicable.
- Unsupported special characters are rejected with field-specific allowlists.
- Security, performance, accessibility, responsive design, and error states have been checked.
- Relevant lint, test, type-check, and build commands pass when the project provides them.
