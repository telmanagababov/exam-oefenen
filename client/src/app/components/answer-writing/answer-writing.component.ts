import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { Question } from '../../models/exam-response';

@Component({
  selector: 'app-answer-writing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './answer-writing.component.html',
  styleUrl: './answer-writing.component.scss',
})
export class AnswerWritingComponent implements OnDestroy {
  question = input<Question | null>(null);
  initialAnswer = input<number | string | Blob | null>(null);
  answerWritten = output<string>();

  answerText = signal<string>('');
  #answerSubject = new Subject<string>();
  #subscription: Subscription;

  constructor() {
    this.#subscription = this.#answerSubject.pipe(debounceTime(250)).subscribe((text) => {
      this.answerWritten.emit(text);
    });
    
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
    if (typeof initialAnswerValue === 'string') {
      this.answerText.set(initialAnswerValue);
    } else {
      this.answerText.set('');
    }
  }

  ngOnDestroy(): void {
    this.#subscription.unsubscribe();
  }

  onAnswerChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const text = target.value;
    this.answerText.set(text);
    this.#answerSubject.next(text);
  }
}
