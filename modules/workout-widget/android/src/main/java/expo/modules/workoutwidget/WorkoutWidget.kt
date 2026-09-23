package expo.modules.workoutwidget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalSize
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

private val Accent = Color(0xFF4FD1B3)
private val Fg = Color(0xFFECECEC)
private val Sub = Color(0xFF8A8C91)
private val Cell = Color(0xFF26282C)
private val Bg = Color(0xFF0E0F11)

private val WEEKDAYS = listOf("월", "화", "수", "목", "금", "토", "일")
private val LEVEL_ALPHA = listOf(1f, 0.25f, 0.45f, 0.75f, 1f)

class WorkoutWidget : GlanceAppWidget() {
  override val sizeMode: SizeMode = SizeMode.Responsive(setOf(SMALL, MEDIUM))

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val entry = WidgetStore.currentEntry(context)
    val openApp = context.packageManager.getLaunchIntentForPackage(context.packageName)

    provideContent {
      var modifier = GlanceModifier.fillMaxSize().background(Bg).padding(16.dp)
      if (openApp != null) modifier = modifier.clickable(actionStartActivity(openApp))

      if (LocalSize.current.width < MEDIUM.width) {
        SmallContent(entry, modifier)
      } else {
        MediumContent(entry, modifier)
      }
    }
  }

  companion object {
    private val SMALL = DpSize(110.dp, 110.dp)
    private val MEDIUM = DpSize(250.dp, 110.dp)
  }
}

private data class CycleView(
  val caption: String,
  val icon: Int,
  val iconColor: Color,
  val title: String,
  val titleColor: Color,
  val detail: String,
  val isEmpty: Boolean,
)

private fun cycleViewOf(entry: WidgetEntry?): CycleView {
  if (entry == null || entry.todayLabel == null) {
    return CycleView("운동 사이클", R.drawable.ic_widget_cycle, Sub, "미등록", Sub, "앱에서 사이클을 등록해보세요", isEmpty = true)
  }
  val label = entry.todayLabel
  return if (entry.doneToday) {
    CycleView("다음 차례", R.drawable.ic_widget_check, Accent, label, Fg, "오늘 운동 완료", isEmpty = false)
  } else {
    val detail = entry.nextLabel?.let { "다음 차례: $it" } ?: "$label 반복 중"
    CycleView("오늘 할 운동", R.drawable.ic_widget_fitness, Sub, label, Accent, detail, isEmpty = false)
  }
}

@Composable
private fun SmallContent(entry: WidgetEntry?, modifier: GlanceModifier) {
  val cycle = cycleViewOf(entry)
  Column(modifier = modifier) {
    IconLabel(R.drawable.ic_widget_flame, Accent, "연속 달성", size = 12)
    StreakValue(entry?.streak ?: 0, valueSize = 42, unitSize = 15)
    Spacer(GlanceModifier.defaultWeight())
    IconLabel(cycle.icon, cycle.iconColor, cycle.caption, size = 11)
    Text(
      text = cycle.title,
      maxLines = 1,
      style = TextStyle(
        color = ColorProvider(cycle.titleColor),
        fontSize = if (cycle.isEmpty) 15.sp else 19.sp,
        fontWeight = FontWeight.Bold,
      ),
    )
  }
}

@Composable
private fun MediumContent(entry: WidgetEntry?, modifier: GlanceModifier) {
  val cycle = cycleViewOf(entry)
  Column(modifier = modifier) {
    Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
      Column {
        IconLabel(R.drawable.ic_widget_flame, Accent, "연속 달성", size = 12)
        StreakValue(entry?.streak ?: 0, valueSize = 34, unitSize = 14)
      }
      Spacer(GlanceModifier.width(20.dp))
      Column(modifier = GlanceModifier.defaultWeight()) {
        IconLabel(cycle.icon, cycle.iconColor, cycle.caption, size = 12)
        Text(
          text = cycle.title,
          maxLines = 1,
          style = TextStyle(color = ColorProvider(cycle.titleColor), fontSize = 22.sp, fontWeight = FontWeight.Bold),
        )
        Text(
          text = cycle.detail,
          maxLines = 1,
          style = TextStyle(color = ColorProvider(Sub), fontSize = 11.sp),
        )
      }
    }
    Spacer(GlanceModifier.defaultWeight())
    WeekGrass(entry)
  }
}

@Composable
private fun IconLabel(icon: Int, iconColor: Color, text: String, size: Int) {
  Row(verticalAlignment = Alignment.CenterVertically) {
    Image(
      provider = ImageProvider(icon),
      contentDescription = null,
      modifier = GlanceModifier.size(size.dp),
      colorFilter = ColorFilter.tint(ColorProvider(iconColor)),
    )
    Spacer(GlanceModifier.width(4.dp))
    Text(text = text, style = TextStyle(color = ColorProvider(Sub), fontSize = size.sp))
  }
}

// Glance엔 baseline 정렬이 없어서 단위 글자를 아래 여백으로 숫자 기준선에 맞춘다
@Composable
private fun StreakValue(streak: Int, valueSize: Int, unitSize: Int) {
  Row(verticalAlignment = Alignment.Bottom) {
    Text(
      text = "$streak",
      style = TextStyle(color = ColorProvider(Fg), fontSize = valueSize.sp, fontWeight = FontWeight.Bold),
    )
    Spacer(GlanceModifier.width(2.dp))
    Text(
      text = "주",
      modifier = GlanceModifier.padding(bottom = (valueSize / 7).dp),
      style = TextStyle(color = ColorProvider(Sub), fontSize = unitSize.sp, fontWeight = FontWeight.Medium),
    )
  }
}

@Composable
private fun WeekGrass(entry: WidgetEntry?) {
  val levels = entry?.weekLevels ?: List(7) { 0 }
  val todayIndex = entry?.todayIndex ?: -1

  Row(modifier = GlanceModifier.fillMaxWidth()) {
    levels.forEachIndexed { i, level ->
      val isToday = i == todayIndex
      val cellColor = if (level > 0) Accent.copy(alpha = LEVEL_ALPHA[level.coerceAtMost(LEVEL_ALPHA.lastIndex)]) else Cell

      Column(
        modifier = GlanceModifier.defaultWeight().padding(start = 3.dp, end = 3.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Box(modifier = GlanceModifier.fillMaxWidth().height(16.dp).cornerRadius(4.dp).background(cellColor)) {}
        Spacer(GlanceModifier.height(3.dp))
        Text(
          text = WEEKDAYS[i],
          style = TextStyle(
            color = ColorProvider(if (isToday) Fg else Sub),
            fontSize = 10.sp,
            fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
          ),
        )
      }
    }
  }
}
