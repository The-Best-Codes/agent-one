| `maxSteps` | `stopWhen`        | `stop()`                                                                               | Multi-step tool calling   |
| :--------- | :---------------- | :------------------------------------------------------------------------------------- | :------------------------ |
| disabled   | `stepCountIs(50)` | throws `signal is aborted without reason` error (undesired)                            | works                     |
| 50         | disabled          | if tool is running, aborts the current tool, but response keep streaming (undesired)   | works                     |
| 50         | `stepCountIs(50)` | if tool is running, aborts the current tool, but response keep streaming (undesired)   | works                     |
| disabled   | disabled          | aborts the current tool or response stream, no subsequent tools are executed (desired) | not working (only 1 step) |

What we need: The AI should be able to take a maximum of 50 steps, calling `stop()` should abort the current tool or response stream and no subsequent tools will be executed, but calling `stop()` should NOT cause any error, multi-step tool calling (up to 50) should work.
