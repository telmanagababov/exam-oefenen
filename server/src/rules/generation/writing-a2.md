# Writing (Schrijven A2) - Exam Rules

## Structure
- Open answers (Short sentences or finishing sentences)

## Task Types
### Task A (Short Message)
- Ask the user to write an email/note (e.g., "Cancel a dentist appointment")
- Must specify 3 points to include (Who, Why, When)

### Task B (Sentence Completion)
- Provide the start of a sentence (e.g., "Ik ga graag naar het park, want...") and the user must finish it

## Validation Logic
AI must check for:
1. Is the message clear?
2. Is the verb position (V2) correct?
3. Are the 3 points included?

## JSON Schema
```json
{
  "instruction": "Write an email to your teacher.",
  "constraints": ["Why you are sick", "When you return", "Ask for homework"],
  "startingPhrases": ["Beste docent,", "..."]
}
```

## Questions
- Generate exactly 4 questions
