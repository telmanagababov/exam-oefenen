export enum ExerciseType {
  READING = 'Reading',
  LISTENING = 'Listening',
  WRITING = 'Writing',
  SPEAKING = 'Speaking',
  KNM = 'KNM',
}

export interface Exercise {
  type: ExerciseType;
  name: string;
  description: string;
}

export const EXERCISES: Exercise[] = [
  {
    type: ExerciseType.READING,
    name: 'Lezen A2',
    description: 'Reading comprehension exercises',
  },
  {
    type: ExerciseType.LISTENING,
    name: 'Luisteren A2',
    description: 'Listening comprehension exercises',
  },
  {
    type: ExerciseType.WRITING,
    name: 'Schrijven A2',
    description: 'Writing exercises',
  },
  {
    type: ExerciseType.SPEAKING,
    name: 'Spreken A2',
    description: 'Speaking exercises',
  },
  {
    type: ExerciseType.KNM,
    name: 'Kennis van de Nederlandse Maatschappij',
    description: 'Knowledge of Dutch society',
  },
];
