## AgentOne Development

When developing AgentOne, keep these principles in mind:

- **Simplicity.** Keep the codebase simple and easy to understand.
  - Avoid unnecessary complexity.
  - Ask before adding new tests.
  - Observe and follow the file naming conventions, directory structure, and modularization/splitting conventions already in the codebase.
- **Clarity.** Write clear and concise code that is easy to read and maintain.
  - Ensure that descriptive text in the UI is user-friendly and easy for non-technical users to understand.
  - Run `npm run format` to ensure your code is properly formatted.
  - Run `npm run lint` to ensure your code follows the style guide.
  - Run `npm run typecheck` to ensure your code has no type errors.
- **Efficiency.** Optimize the code for performance and scalability.
  - High performance operations.
  - For long blocking tasks, use asynchronous programming or create a worker thread (discuss with a maintainer before creating new workers).
  - Minimize React re-renders (but be aware that excessive optimizations can actually decrease the performance, which is not what we want).
