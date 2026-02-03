import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AnswerValue } from '../../store/exercise';

@Component({
  selector: 'app-submit-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './submit-confirmation-modal.component.html',
  styleUrl: './submit-confirmation-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitConfirmationModalComponent {
  totalQuestions = input.required<number>();
  answeredCount = input.required<number>();
  answers = input.required<Record<number, AnswerValue>>();

  cancel = output<void>();
  confirm = output<void>();
  questionClick = output<number>();

  message = computed(() => {
    const total = this.totalQuestions();
    const answered = this.answeredCount();
    const unanswered = total - answered;
    if (unanswered === 0) {
      return 'Alle vragen zijn beantwoord.';
    }
    return `Er zijn ${unanswered} van de ${total} vragen niet beantwoord.`;
  });

  unansweredQuestions = computed(() => {
    const total = this.totalQuestions();
    const answers = this.answers();
    const unanswered: number[] = [];

    for (let i = 0; i < total; i++) {
      const answer = answers[i];
      if (answer === null || answer === undefined) {
        unanswered.push(i);
      }
    }

    return unanswered;
  });

  onClose(): void {
    this.cancel.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onQuestionClick(questionIndex: number): void {
    this.questionClick.emit(questionIndex);
  }
}
