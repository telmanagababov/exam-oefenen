import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  Injector,
  OnInit,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { AnswerRecordingComponent } from '../../components/answer-recording/answer-recording.component';
import { AnswerSelectionComponent } from '../../components/answer-selection/answer-selection.component';
import { AnswerWritingComponent } from '../../components/answer-writing/answer-writing.component';
import { QuestionListeningComponent } from '../../components/question-listening/question-listening.component';
import { QuestionReadingComponent } from '../../components/question-reading/question-reading.component';
import { ExerciseType } from '../../models/exercise-type';
import {
  loadExamData,
  selectCurrentAnswer,
  selectCurrentQuestion,
  selectCurrentQuestionIndex,
  selectExamData,
  selectExamError,
  selectIsLoading,
  selectSelectedExerciseType,
  setAnswer,
} from '../../store/exercise';

@Component({
  selector: 'app-exercise-exam',
  standalone: true,
  imports: [
    CommonModule,
    QuestionReadingComponent,
    QuestionListeningComponent,
    AnswerSelectionComponent,
    AnswerRecordingComponent,
    AnswerWritingComponent,
  ],
  templateUrl: './exercise-exam.component.html',
  styleUrl: './exercise-exam.component.scss',
})
export class ExerciseExamComponent implements OnInit {
  #store = inject(Store);
  #injector = inject(Injector);

  ExerciseType = ExerciseType;

  selectedExerciseType = this.#store.selectSignal(selectSelectedExerciseType);
  examData = this.#store.selectSignal(selectExamData);
  isLoading = this.#store.selectSignal(selectIsLoading);
  error = this.#store.selectSignal(selectExamError);
  currentQuestion = this.#store.selectSignal(selectCurrentQuestion);
  currentQuestionIndex = this.#store.selectSignal(selectCurrentQuestionIndex);
  currentAnswer = this.#store.selectSignal(selectCurrentAnswer);

  #examLoaded = signal<boolean>(false);

  ngOnInit(): void {
    runInInjectionContext(this.#injector, () => {
      effect(() => {
        const exerciseType = this.selectedExerciseType();
        if (exerciseType !== null && !this.#examLoaded()) {
          this.#examLoaded.set(true);
          this.#loadExam(exerciseType);
        }
      });
    });
  }

  #loadExam(exerciseType: ExerciseType): void {
    this.#store.dispatch(loadExamData({ examType: exerciseType }));
  }

  retryLoadExam(): void {
    const exerciseType = this.selectedExerciseType();
    if (exerciseType !== null) {
      this.#examLoaded.set(false);
      this.#loadExam(exerciseType);
    }
  }

  onAnswerSelected(answerIndex: number): void {
    const questionIndex = this.currentQuestionIndex();
    this.#store.dispatch(
      setAnswer({
        questionIndex,
        answer: answerIndex,
      }),
    );
  }

  onAnswerRecorded(audioBlob: Blob | null): void {
    const questionIndex = this.currentQuestionIndex();
    this.#store.dispatch(
      setAnswer({
        questionIndex,
        answer: audioBlob,
      }),
    );
  }

  onAnswerWritten(text: string): void {
    const questionIndex = this.currentQuestionIndex();
    this.#store.dispatch(
      setAnswer({
        questionIndex,
        answer: text,
      }),
    );
  }
}
