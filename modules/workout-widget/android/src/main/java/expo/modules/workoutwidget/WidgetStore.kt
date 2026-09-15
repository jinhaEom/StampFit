package expo.modules.workoutwidget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class WidgetEntry(
  val timestamp: Long,
  val streak: Int,
  val doneToday: Boolean,
  val todayLabel: String?,
  val nextLabel: String?,
  val weekLevels: List<Int>,
  val todayIndex: Int,
)

object WidgetStore {
  private const val PREFS = "workout_widget"
  private const val KEY_TIMELINE = "timeline"

  fun save(context: Context, json: String) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_TIMELINE, json)
      .apply()
  }

  // 이미 시작된 항목 중 가장 최근 것 — 자정이 지나면 다음 날 항목이 선택된다
  fun currentEntry(context: Context, now: Long = System.currentTimeMillis()): WidgetEntry? {
    val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getString(KEY_TIMELINE, null) ?: return null
    val entries = runCatching { JSONArray(raw) }.getOrNull() ?: return null
    return (0 until entries.length())
      .map { parse(entries.getJSONObject(it)) }
      .lastOrNull { it.timestamp <= now }
  }

  private fun parse(entry: JSONObject): WidgetEntry {
    val props = entry.getJSONObject("props")
    val levels = props.optJSONArray("weekLevels")
    return WidgetEntry(
      timestamp = entry.getLong("timestamp"),
      streak = props.optInt("streak"),
      doneToday = props.optBoolean("doneToday"),
      todayLabel = props.optString("todayLabel").ifEmpty { null },
      nextLabel = props.optString("nextLabel").ifEmpty { null },
      weekLevels = List(7) { levels?.optInt(it) ?: 0 },
      todayIndex = props.optInt("todayIndex", -1),
    )
  }
}
