import { requireOptionalNativeModule } from 'expo';

type WorkoutWidgetModule = { updateTimeline(json: string): Promise<void> };

export default requireOptionalNativeModule<WorkoutWidgetModule>('WorkoutWidget');
