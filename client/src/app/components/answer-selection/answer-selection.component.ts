import { CommonModule } from '@angular/common';
import { Component, effect, input, output, signal } from '@angular/core';
import { Question } from '../../models/exam-response';

@Component({
  selector: 'app-answer-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './answer-selection.component.html',
  styleUrl: './answer-selection.component.scss',
})
export class AnswerSelectionComponent {
  question = input<Question | null>(null);
  initialAnswer = input<number | string | Blob | null>(null);
  answerSelected = output<number>();

  selectedIndex = signal<number | null>(null);

  constructor() {
    // Watch for changes in question or initialAnswer
    effect(() => {
      // Track both signals - effect will re-run when either changes
      this.question();
      this.initialAnswer();
      this.#initializeAnswer();
    });
  }

  #initializeAnswer(): void {
    const initialAnswerValue = this.initialAnswer();
    if (initialAnswerValue !== null && typeof initialAnswerValue === 'number') {
      this.selectedIndex.set(initialAnswerValue);
    } else {
      this.selectedIndex.set(null);
    }
  }

  onAnswerSelect(index: number): void {
    this.selectedIndex.set(index);
    this.answerSelected.emit(index);
  }
}
