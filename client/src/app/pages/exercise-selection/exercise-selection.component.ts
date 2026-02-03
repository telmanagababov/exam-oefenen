import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { EXERCISES, ExerciseType } from '../../models/exercise-type';
import { selectSelectedExerciseType, setSelectedExerciseType } from '../../store/exercise';

@Component({
  selector: 'app-exercise-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exercise-selection.component.html',
  styleUrl: './exercise-selection.component.scss',
})
export class ExerciseSelectionComponent {
  #store = inject(Store);

  exercises = EXERCISES;

  selectedExerciseType = this.#store.selectSignal(selectSelectedExerciseType);

  onExerciseClick(exerciseType: ExerciseType): void {
    this.#store.dispatch(setSelectedExerciseType({ exerciseType }));
  }
}
