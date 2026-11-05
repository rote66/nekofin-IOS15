package expo.modules.nativelayout

import android.os.Build
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.ui.ExpoUIView

class RailDestination : Record {
  @Field var key: String = ""
  @Field var role: String = "tab"
  @Field var title: String = ""
  @Field var drawable: String = ""
}

class SidebarServer : Record {
  @Field var id: String = ""
  @Field var name: String = ""
  @Field var type: String = "jellyfin"
  @Field var avatarUri: String = ""
}

class NativeLayoutModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NativeLayout")
    Function("getMaterialColors") { scheme: String ->
      val context = appContext.currentActivity ?: appContext.reactContext ?: return@Function null
      val colors = when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && scheme == "dark" ->
          dynamicDarkColorScheme(context)
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> dynamicLightColorScheme(context)
        scheme == "dark" -> darkColorScheme()
        else -> lightColorScheme()
      }
      fun hex(color: Color): String {
        val argb = color.toArgb()
        return "#%02X%02X%02X".format(
          (argb shr 16) and 0xff,
          (argb shr 8) and 0xff,
          argb and 0xff
        )
      }
      mapOf(
        "primary" to hex(colors.primary),
        "surface" to hex(colors.surface),
        "surfaceContainerLow" to hex(colors.surfaceContainerLow),
        "surfaceContainerHigh" to hex(colors.surfaceContainerHigh),
        "surfaceContainerHighest" to hex(colors.surfaceContainerHighest),
        "onSurface" to hex(colors.onSurface),
        "onSurfaceVariant" to hex(colors.onSurfaceVariant),
        "outlineVariant" to hex(colors.outlineVariant),
        "onPrimary" to hex(colors.onPrimary),
        "error" to hex(colors.error),
        "scrim" to hex(colors.scrim)
      )
    }
    Function("isWindowOrientationFlexible") {
      val activity = appContext.currentActivity ?: return@Function false
      // Multi-window ignores orientation locks. Android 16+ also ignores them
      // on large windows for apps targeting API 36+, including fullscreen ones.
      activity.isInMultiWindowMode || (
        Build.VERSION.SDK_INT >= 36 && activity.applicationInfo.targetSdkVersion >= 36 &&
          activity.resources.configuration.smallestScreenWidthDp >= 600
        )
    }
    View(NavigationRailView::class) {
      Events("onDestinationSelected", "onServerSelected", "onToggleSidebar")
      Prop("destinations") { view, value: List<RailDestination> -> view.destinations = value }
      Prop("serversTitle") { view, value: String -> view.serversTitle = value }
      Prop("collapseLabel") { view, value: String -> view.collapseLabel = value }
      Prop("servers") { view, value: List<SidebarServer> -> view.servers = value }
      Prop("selectedServerId") { view, value: String -> view.selectedServerId = value }
      Prop("selected") { view, value: String -> view.selected = value }
      Prop("dark") { view, value: Boolean -> view.dark = value }
      Prop("surfaceColor") { view, value: Int -> view.surfaceColor = value }
      Prop("selectedColor") { view, value: Int -> view.selectedColor = value }
      Prop("unselectedColor") { view, value: Int -> view.unselectedColor = value }
      OnViewDidUpdateProps { view -> view.updateRail() }
    }
    View(FloatingTabsView::class) {
      Events("onDestinationSelected", "onToggleSidebar")
      Prop("destinations") { view, value: List<RailDestination> -> view.destinations = value }
      Prop("selected") { view, value: String -> view.selected = value }
      Prop("dark") { view, value: Boolean -> view.dark = value }
      Prop("toggleSidebarLabel") { view, value: String -> view.toggleSidebarLabel = value }
      Prop("collapsed") { view, value: Boolean -> view.collapsed = value }
      Prop("kind") { view, value: String -> view.kind = value }
      Prop("selectedColor") { view, value: Int -> view.selectedColor = value }
      Prop("unselectedColor") { view, value: Int -> view.unselectedColor = value }
      OnViewDidUpdateProps { view -> view.updateTabs() }
    }
    View(FloatingTabsGestureView::class) {}
    View(NavigationSurfaceView::class) {
      Prop("sampleContent") { view, value: Boolean -> view.sampleContent = value }
      Prop("cornerRadius") { view, value: Float -> view.cornerRadius = value }
      Prop("drawer") { view, value: Boolean -> view.drawer = value }
      Prop("trailingWidth") { view, value: Float -> view.trailingWidth = value }
      Prop("trailingGap") { view, value: Float -> view.trailingGap = value }
      OnViewDidUpdateProps { view -> view.updateShape() }
      Prop("surfaceColor") { view, value: Int -> view.surfaceColor = value }
    }
    ExpoUIView<MaterialSurfaceProps>("MaterialSurfaceView") {
      Content { props -> MaterialSurfaceContent(props) }
    }
    ExpoUIView<GlassIconButtonProps>("GlassIconButtonView") {
      val onButtonPressed by Event<Unit>()
      Content { props -> GlassIconButtonContent(props) { onButtonPressed(Unit) } }
    }
    ExpoUIView<PopupMenuProps>("PopupMenuView") {
      val onDismissRequest by Event<Unit>()
      val onDismissed by Event<Unit>()
      Content { props -> PopupMenuContent(props,
        onDismiss = { onDismissRequest(Unit) }, onDismissed = { onDismissed(Unit) }) }
    }
    ExpoUIView<PopupMenuItemProps>("PopupMenuItemView") {
      val onItemPressed by Event<Unit>()
      Content { props -> PopupMenuItemContent(props) { onItemPressed(Unit) } }
    }
    ExpoUIView<PopupSubmenuProps>("PopupSubmenuView") {
      Content { props -> PopupSubmenuContent(props) }
    }
  }
}
