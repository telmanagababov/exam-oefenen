import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AudioBlobPlayerComponent } from '../../components/audio-blob-player/audio-blob-player.component';
import {
  AnswerValue,
  selectAnswers,
  selectExamData,
  selectExamError,
  selectValidationResult,
  validateAnswers,
} from '../../store/exercise';

interface NormalizedValidationResult {
  isMultipleChoiceType: boolean;
  passed: boolean;
  totalCount: number;
  correct: number;
  averageScore: number | null;
  answers: Array<{
    correct: boolean;
    feedback: string;
    score?: number;
  }>;
}

@Component({
  selector: 'app-exercise-results',
  standalone: true,
  imports: [CommonModule, AudioBlobPlayerComponent],
  templateUrl: './exercise-results.component.html',
  styleUrl: './exercise-results.component.scss',
})
export class ExerciseResultsComponent implements OnInit {
  #store = inject(Store);

  validationResult = this.#store.selectSignal(selectValidationResult);
  examData = this.#store.selectSignal(selectExamData);
  error = this.#store.selectSignal(selectExamError);
  isValidating = computed(() => this.validationResult() === null && !this.error());

  // Unified computed model for validation results
  normalizedResult = computed((): NormalizedValidationResult | null => {
    const result = this.validationResult();
    if (!result) return null;

    const isMultipleChoiceType = 'totalQuestions' in result;

    return {
      isMultipleChoiceType,
      passed: result.passed,
      totalCount: isMultipleChoiceType ? result.totalQuestions : result.totalTasks,
      correct: isMultipleChoiceType ? result.correctAnswers : 0,
      averageScore: isMultipleChoiceType ? null : result.averageScore,
      answers: result.answers,
    };
  });

  // Get questions for titles
  questions = computed(() => this.examData()?.exercises?.questions ?? []);

  // Get user answers
  userAnswers = this.#store.selectSignal(selectAnswers);

  // Track expanded state for each answer card
  expandedAnswers = signal<Set<number>>(new Set());

  toggleAnswer(index: number): void {
    const current = this.expandedAnswers();
    const newSet = new Set(current);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    this.expandedAnswers.set(newSet);
  }

  isAnswerExpanded(index: number): boolean {
    return this.expandedAnswers().has(index);
  }

  getUserAnswer(index: number): string {
    const answer: AnswerValue = this.userAnswers()[index];
    if (answer === null || answer === undefined) {
      return 'Geen antwoord gegeven';
    }
    if (typeof answer === 'number') {
      const question = this.questions()[index];
      if (question?.answers && question.answers[answer]) {
        return question.answers[answer];
      }
      return `Antwoord ${answer + 1}`;
    }
    if (typeof answer === 'string') {
      return answer;
    }
    if (answer instanceof Blob) {
      return 'Audio opname';
    }
    return 'Onbekend antwoord type';
  }

  getUserAnswerBlob(index: number): Blob | null {
    const answer: AnswerValue = this.userAnswers()[index];
    if (answer instanceof Blob) {
      return answer;
    }
    return null;
  }

  isAnswerBlob(index: number): boolean {
    const answer: AnswerValue = this.userAnswers()[index];
    return answer instanceof Blob;
  }

  ngOnInit(): void {
    this.#store.dispatch(validateAnswers());
  }

  retryValidation(): void {
    this.#store.dispatch(validateAnswers());
  }
}
