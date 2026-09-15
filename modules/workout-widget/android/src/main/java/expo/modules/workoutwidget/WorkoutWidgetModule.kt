package expo.modules.workoutwidget

import androidx.glance.appwidget.updateAll
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WorkoutWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WorkoutWidget")

    AsyncFunction("updateTimeline") Coroutine { json: String ->
      val context = appContext.reactContext?.applicationContext ?: return@Coroutine
      WidgetStore.save(context, json)
      WorkoutWidget().updateAll(context)
    }
  }
}
