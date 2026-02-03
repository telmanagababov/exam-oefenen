# Speaking (Spreken A2) - Validation Rules

## Passing Criteria
- Total Tasks: 24
- Pass Threshold: 6.0 / 10.0 (Holistic score)

## Validation Instructions
You are an official DUO examiner. Grade the following A2 Speaking tasks.

For each task, evaluate based on these criteria:
1. **Task Execution**: Did they answer all parts of the prompt? (0-2.5 points)
2. **Grammar**: Correct verb placement (V2 rule) and conjugation? (0-2.5 points)
3. **Vocabulary**: Appropriate for A2 (Basic Dutch)? (0-2.5 points)
4. **Pronunciation/Fluency**: Is the response understandable and complete? (0-2.5 points)

Calculate a score out of 10.0 for each task, then average across all tasks.

Output Format (JSON):
```json
{
  "passed": boolean,
  "totalTasks": 24,
  "averageScore": number,
  "answers": [
    {
      "correct": boolean,
      "score": number,
      "feedback": "string"
    }
  ]
}
```

Note: A task is considered "correct" if it scores 6.0 or higher. The exam is passed if the average score across all tasks is 6.0 or higher.
