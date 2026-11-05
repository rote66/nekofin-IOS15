import ExpoModulesCore
import ExpoUI
import SwiftUI
import UIKit

public class NativeLayoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLayout")

    OnCreate {
      // Expo UI SDK 55 lacks the scrollPosition binding present in the
      // upstream SDK 57 episode panel. Keep native SwiftUI List scrolling.
      ViewModifierRegistry.register("nekofinEpisodeRowID") { params, _, _ in
        EpisodeRowIDModifier(id: params["id"] as? String ?? "")
      }
      ViewModifierRegistry.register("nekofinEpisodeScrollTo") { params, _, _ in
        EpisodeScrollToModifier(targetID: params["targetID"] as? String ?? "")
      }
      ViewModifierRegistry.register("nekofinEpisodeListStyle") { _, _, _ in
        NekofinEpisodeListStyleModifier()
      }
      ViewModifierRegistry.register("nekofinEpisodeListRow") { _, _, _ in
        NekofinEpisodeListRowModifier()
      }
      ViewModifierRegistry.register("nekofinButtonBorderShape") { _, _, _ in
        NekofinButtonBorderShapeModifier()
      }
      ViewModifierRegistry.register("nekofinMenuIndicator") { _, _, _ in
        NekofinMenuIndicatorModifier()
      }
      ViewModifierRegistry.register("nekofinAccessibilityTraits") { params, _, _ in
        NekofinAccessibilityTraitsModifier(traits: params["traits"] as? [String] ?? [])
      }
      ViewModifierRegistry.register("nekofinAccessibilityCombine") { _, _, _ in
        NekofinAccessibilityCombineModifier()
      }
      ViewModifierRegistry.register("nekofinAccessibilityHidden") { _, _, _ in
        NekofinAccessibilityHiddenModifier()
      }
      ViewModifierRegistry.register("nekofinFontTextStyle") { params, _, _ in
        NekofinFontTextStyleModifier(
          textStyle: params["textStyle"] as? String ?? "body",
          weight: params["weight"] as? String
        )
      }
      ViewModifierRegistry.register("nekofinPresentationBackground") { params, _, _ in
        NekofinPresentationBackgroundModifier(color: params["color"] as? String ?? "#000000")
      }
      ViewModifierRegistry.register("nekofinPlayerNavigation") { params, appContext, eventDispatcher in
        try NekofinPlayerNavigationModifier(
          from: params,
          appContext: appContext,
          eventDispatcher: eventDispatcher
        )
      }
      ViewModifierRegistry.register("nekofinScrollEdgeEffectStyle") { _, _, _ in
        NekofinScrollEdgeEffectStyleModifier()
      }
    }

    View(TabSidebarView.self) {
      Events("onServerSelected")
      Prop("servers") { (view: TabSidebarView, servers: [SidebarServer]) in
        view.servers = servers
      }
      Prop("serversTitle") { (view: TabSidebarView, title: String) in
        view.serversTitle = title
      }
      Prop("selectedServerId") { (view: TabSidebarView, id: String) in
        view.selectedServerId = id
      }
    }
  }
}

struct SidebarServer: Record {
  @Field var id = ""
  @Field var name = ""
  @Field var type = ""
  @Field var avatarUri = ""
}

/// The existing router owns UITabBarController. UIKit owns its tab/sidebar transition;
/// this view only supplies the sidebar's public header and footer configurations.
final class TabSidebarView: ExpoView {
  let onServerSelected = EventDispatcher()
  var servers: [SidebarServer] = [] { didSet { invalidateContent() } }
  var serversTitle = "" { didSet { invalidateContent() } }
  var selectedServerId = "" { didSet { invalidateContent() } }
  private weak var tabs: UITabBarController?
  private var needsContentUpdate = true

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil { invalidateContent() }
  }

  override func didAddSubview(_ subview: UIView) {
    super.didAddSubview(subview)
    invalidateContent()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    updateSidebar()
  }

  private func invalidateContent() {
    needsContentUpdate = true
    setNeedsLayout()
    // The native tabs controller attaches after Fabric mounts the wrapper's children.
    DispatchQueue.main.async { [weak self] in self?.updateSidebar() }
  }

  private func findTabs(in view: UIView) -> UITabBarController? {
    if let controller = view.next as? UITabBarController { return controller }
    for child in view.subviews {
      if let controller = findTabs(in: child) { return controller }
    }
    return nil
  }

  private func updateSidebar() {
    guard #available(iOS 18.0, *), window != nil,
          let controller = tabs ?? findTabs(in: self) else { return }
    if tabs !== controller {
      tabs = controller
      needsContentUpdate = true
    }
    guard needsContentUpdate else { return }
    needsContentUpdate = false
    controller.sidebar.preferredLayout = .overlap
    controller.sidebar.headerContentConfiguration = UIHostingConfiguration {
      Text("NekoFin")
        .font(.largeTitle.bold())
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 8)
    }
    controller.sidebar.footerContentConfiguration = servers.isEmpty ? nil : UIHostingConfiguration {
      SidebarServerShortcuts(servers: servers, selectedID: selectedServerId, title: serversTitle) { [weak self] id in
        self?.onServerSelected(["id": id])
      }
    }
  }
}

private struct SidebarServerShortcuts: View {
  let servers: [SidebarServer]
  let selectedID: String
  let title: String
  let select: (String) -> Void

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(title)
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(.secondary)
        .padding(.top, 20)
        .padding(.bottom, 8)
      ForEach(servers, id: \.id) { server in
        Button {
          select(server.id)
        } label: {
          HStack(spacing: 12) {
            avatar(server)
              .frame(width: 28, height: 28)
            Text(server.name)
              .lineLimit(1)
              .foregroundStyle(.primary)
            Spacer(minLength: 0)
            if server.id == selectedID {
              Image(systemName: "checkmark")
                .font(.footnote.weight(.semibold))
            }
          }
          .padding(.vertical, 10)
          .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(server.id == selectedID ? .isSelected : [])
      }
    }
  }

  @ViewBuilder private func avatar(_ server: SidebarServer) -> some View {
    if let url = URL(string: server.avatarUri), url.isFileURL,
       let image = UIImage(contentsOfFile: url.path) {
      Image(uiImage: image).resizable().scaledToFill().clipShape(Circle())
    } else {
      Image(systemName: "externaldrive")
        .foregroundStyle(server.type == "emby" ? Color.green : Color.purple)
    }
  }
}
