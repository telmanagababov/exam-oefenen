# Reading (Lezen A2) - Exam Rules

## Structure
- Multiple Choice (1 of 4 correct)

## Content Requirements
- Use everyday texts: advertisements, emails from neighbors, workplace instructions, or news snippets about Dutch society
- Vocabulary: Limit to the "Basiswoordenlijst Amsterdam" (top 2000 words). No complex metaphors
- Distractors: The "wrong" answers must be plausible but clearly contradicted by the text

## JSON Schema
```json
{
  "text": "Full text of the story/ad",
  "questions": [
    { "id": 1, "question": "vraag...", "options": ["A", "B", "C", "D"], "correct": 0 }
  ]
}
```

## Questions
- Generate exactly 25 questions
