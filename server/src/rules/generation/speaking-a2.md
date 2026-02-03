# Speaking (Spreken A2) - Exam Rules

## Structure

- Mixed (Prompt-Response and Sentence Completion)

## Task Types

### Task Type 1 (Prompt Response)

- The AI provides a situational question (e.g., "Wat vind je van het weer in Nederland?")
- The user must give a spoken answer

### Task Type 2 (Sentence Completion)

- The AI provides the beginning of a sentence (e.g., "Als ik vrij ben, dan...")
- The user must complete it logically and grammatically

## Content Requirements

- Focus on daily life: hobbies, work, family, and opinions

## Evaluation Criteria (for AI Validation)

- Pronunciation: (If using STT) Is it understandable?
- Fluency: Is the response a complete sentence?
- Grammar: Correct verb placement (V2 rule) and conjugation

## Tech Note

In your web app, the "AI" will generate the prompt text. The frontend will use the Web Speech API to turn the prompt into audio and (optionally) record the user's voice or use Speech-to-Text for validation.

## JSON Schema

```json
{
  "tasks": [
    {
      "type": "question",
      "prompt": "Je bent in de supermarkt. Je kunt de melk niet vinden. Wat vraag je aan de medewerker?",
      "exampleCorrect": "Pardon, waar staat de melk?"
    },
    {
      "type": "completion",
      "prompt": "Ik ga elke dag met de fiets naar mijn werk, omdat...",
      "exampleCorrect": "...omdat dat gezond is."
    }
  ]
}
```

## Questions

- Generate exactly 16 questions
