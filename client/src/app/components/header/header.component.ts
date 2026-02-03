import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  Injector,
  OnDestroy,
  OnInit,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { RouteName } from '../../models/route-name';
import { NavigationService } from '../../services/navigation.service';
import { selectIsExamStep } from '../../store/app';
import {
  selectExamDurationSeconds,
  selectExamError,
  selectIsLoading,
  selectTimeLeft,
  setTimeLeft,
} from '../../store/exercise';

/** Seconds below which the timer shows "X sec" instead of "X min", and when the time-up warning is shown. */
const TIMER_SECONDS_THRESHOLD = 100;

/** How long the "time almost up" warning popup is displayed, in milliseconds. */
const TIMER_WARNING_DISPLAY_MS = 3000;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  #store = inject(Store);
  #navigationService = inject(NavigationService);
  #injector = inject(Injector);

  routeNames = RouteName;

  isExamStep = this.#store.selectSignal(selectIsExamStep);
  isLoading = this.#store.selectSignal(selectIsLoading);
  error = this.#store.selectSignal(selectExamError);
  timeLeft = this.#store.selectSignal(selectTimeLeft);
  formattedTimeLeft = computed(() => this.#formatTimeLeft(this.timeLeft()));
  examDurationSeconds = this.#store.selectSignal(selectExamDurationSeconds);
  showTimeWarning = signal(false);
  showTimer = computed(() => this.isExamStep() && !this.isLoading() && !this.error());
  #timerInterval?: number;
  #timeWarningTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    runInInjectionContext(this.#injector, () => {
      effect(() => {
        const isExam = this.isExamStep();
        const isLoading = this.isLoading();
        const hasError = !!this.error();

        if (isExam) {
          if (!isLoading && !hasError) {
            this.#startTimer();
          } else {
            this.#stopTimer();
          }
        } else {
          this.#stopTimer();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.#stopTimer();
  }

  #startTimer(): void {
    this.#stopTimer();
    let totalSeconds = this.examDurationSeconds();
    this.#store.dispatch(setTimeLeft({ value: totalSeconds }));

    this.#timerInterval = window.setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        this.#handleTimeUp();
        return;
      }
      if (totalSeconds === TIMER_SECONDS_THRESHOLD) {
        this.#showTimeUpWarning();
      }
      this.#store.dispatch(setTimeLeft({ value: totalSeconds }));
    }, 1000);
  }

  #stopTimer(): void {
    if (this.#timerInterval) {
      clearInterval(this.#timerInterval);
      this.#timerInterval = undefined;
    }
    this.#clearWarningState();
  }

  #clearWarningState(): void {
    if (this.#timeWarningTimeout) {
      clearTimeout(this.#timeWarningTimeout);
      this.#timeWarningTimeout = undefined;
    }
    this.showTimeWarning.set(false);
  }

  #showTimeUpWarning(): void {
    this.showTimeWarning.set(true);
    this.#timeWarningTimeout = setTimeout(() => {
      this.showTimeWarning.set(false);
      this.#timeWarningTimeout = undefined;
    }, TIMER_WARNING_DISPLAY_MS);
  }

  #formatTimeLeft(seconds: number): string {
    return seconds >= TIMER_SECONDS_THRESHOLD
      ? `${Math.floor(seconds / 60)} min`
      : `${seconds} sec`;
  }

  #handleTimeUp(): void {
    this.#stopTimer();
    this.#store.dispatch(setTimeLeft({ value: 0 }));
    this.#navigationService.navigateToResults();
  }

  onLogoClick(): void {
    this.#navigationService.navigateToSelection();
  }
}
