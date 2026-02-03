import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { NavigationService } from '../../services/navigation.service';
import {
  clearCurrentStep,
  selectCurrentStep,
  selectIsExamStep,
  selectIsReviewStep,
  selectIsSelectionStep,
} from '../../store/app';
import {
  clearExamData,
  clearSelectedExerciseType,
  selectAnsweredCount,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectExamData,
  selectExamError,
  selectIsLoading,
  selectSelectedExerciseType,
  setCurrentQuestionIndex,
} from '../../store/exercise';
import { SubmitConfirmationModalComponent } from '../submit-confirmation-modal/submit-confirmation-modal.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, SubmitConfirmationModalComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  #store = inject(Store);
  #navigationService = inject(NavigationService);

  currentStep = this.#store.selectSignal(selectCurrentStep);
  isSelectionStep = this.#store.selectSignal(selectIsSelectionStep);
  isExamStep = this.#store.selectSignal(selectIsExamStep);
  isReviewStep = this.#store.selectSignal(selectIsReviewStep);
  isLoading = this.#store.selectSignal(selectIsLoading);
  error = this.#store.selectSignal(selectExamError);
  currentQuestionIndex = this.#store.selectSignal(selectCurrentQuestionIndex);
  examData = this.#store.selectSignal(selectExamData);
  selectedExerciseType = this.#store.selectSignal(selectSelectedExerciseType);
  answeredCount = this.#store.selectSignal(selectAnsweredCount);
  answers = this.#store.selectSignal(selectAnswers);

  totalQuestions = computed(() => this.examData().exercises?.questions?.length || 0);
  isFirstQuestion = computed(() => this.currentQuestionIndex() === 0);
  isLastQuestion = computed(
    () => this.currentQuestionIndex() === Math.max(0, this.totalQuestions() - 1),
  );
  hasError = computed(() => !!this.error());
  isDisabled = computed(() => this.isLoading() || this.hasError());

  showSubmitModal = signal(false);

  onPrevious(): void {
    const currentIndex = this.currentQuestionIndex();
    if (currentIndex > 0) {
      this.#store.dispatch(setCurrentQuestionIndex({ index: currentIndex - 1 }));
    }
  }

  onNext(): void {
    const currentIndex = this.currentQuestionIndex();
    const total = this.totalQuestions();
    if (currentIndex < total - 1) {
      this.#store.dispatch(setCurrentQuestionIndex({ index: currentIndex + 1 }));
    }
  }

  onModalCancel(): void {
    this.showSubmitModal.set(false);
  }

  onModalConfirm(): void {
    this.showSubmitModal.set(false);
    this.#navigationService.navigateToResults();
  }

  onQuestionClick(questionIndex: number): void {
    this.showSubmitModal.set(false);
    this.#store.dispatch(setCurrentQuestionIndex({ index: questionIndex }));
  }

  onStart(): void {
    const exerciseType = this.selectedExerciseType();
    if (exerciseType) {
      this.#navigationService.navigateToExam(exerciseType);
    }
  }

  onClose(): void {
    this.#store.dispatch(clearExamData());
    this.#store.dispatch(clearSelectedExerciseType());
    this.#store.dispatch(clearCurrentStep());
    this.#navigationService.navigateToSelection();
  }
}
