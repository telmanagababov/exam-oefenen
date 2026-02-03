# Listening (Luisteren A2) - Exam Rules

## Structure
- Multiple Choice (1 of 4 correct)

## Content Requirements
- Dialogues between two people (e.g., at the doctor, at the supermarket, calling a school)
- Since this is a web app, the AI must provide a transcript and a contextDescription
- Style: Spoken Dutch is more informal. Use "je/jij" instead of "u" unless it's a formal setting
- Logic: The answer should not just be a keyword match; the student must understand the intent of the speaker

## JSON Schema
```json
{
  "context": "Context of the audio",
  "transcript": "Full text of the dialogue",
  "questions": [
    { "id": 1, "question": "Wat gaat de man doen?", "options": ["...", "...", "..."], "correct": 1 }
  ]
}
```

## Questions
- Generate exactly 25 questions
