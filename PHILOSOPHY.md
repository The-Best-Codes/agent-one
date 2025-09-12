## AgentOne Development

When developing AgentOne, keep these principles in mind:

- **Simplicity.** Keep the codebase simple and easy to understand.
  - Avoid unnecessary complexity.
  - Ask before adding new tests.
  - Observe and follow the file naming conventions, directory structure, and modularization/splitting conventions already in the codebase.
- **Clarity.** Write clear and concise code that is easy to read and maintain.
  - This also applies to descriptive text in the UI. Ensure that it is user-friendly and easy for non-technical users to understand.
- **Efficiency.** Optimize the code for performance and scalability.
  - High performance operations.
  - For long blocking tasks, use asynchronous programming or create a worker thread (discuss with a maintainer before creating new workers).
  - Minimize React re-renders (but be aware that excessive optimizations can actually decrease the performance, which is not what we want).
