import SwiftUI
import ExpoModulesCore

/// Match the original per-version presentation while SDK55 uses List as the
/// lazy container: iOS 17+ mimics the upstream ScrollView, iOS 16.4 keeps its
/// original List styling, and older iOS gets a conservative plain-list fallback.
struct NekofinEpisodeListStyleModifier: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 17.0, *) {
      content
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .scrollIndicators(.hidden)
        .listSectionSpacing(0)
        .contentMargins(.top, 8, for: .scrollContent)
        .contentMargins(.bottom, 16, for: .scrollContent)
    } else if #available(iOS 16.4, *) {
      content
    } else if #available(iOS 16.0, *) {
      content
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .scrollIndicators(.hidden)
    } else {
      content.listStyle(.plain)
    }
  }
}

/// SDK 55 removed the SwiftUI NavigationStack/Toolbar JavaScript wrappers,
/// although the native SwiftUI APIs remain available on the app's supported
/// iOS 16.4+ range. Recreate the original native sheet navigation rather than
/// replacing it with a hand-built HStack header.
struct NekofinPlayerNavigationModifier: ViewModifier, Record {
  @Field var title: String = ""
  @Field var showsBack: Bool = false
  @Field var backLabel: String = "Back"
  @Field var backAccessibilityLabel: String = "Back"
  @Field var closeAccessibilityLabel: String = "Close"
  @Field var backgroundColor: String = "#000000"
  @Field var tintColor: String = "#007AFF"

  var eventDispatcher: EventDispatcher?

  init() {}

  init(from params: Dict, appContext: AppContext, eventDispatcher: EventDispatcher) throws {
    try self = .init(from: params, appContext: appContext)
    self.eventDispatcher = eventDispatcher
  }

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 16.0, *) {
      NavigationStack {
        content
          .navigationTitle(title)
          .navigationBarTitleDisplayMode(.inline)
          .toolbar {
            if showsBack {
              ToolbarItem(placement: .topBarLeading) {
                Button {
                  eventDispatcher?(["nekofinPlayerNavigation": ["action": "back"]])
                } label: {
                  Label(backLabel, systemImage: "chevron.backward")
                }
                .accessibilityLabel(backAccessibilityLabel)
              }
            }
            ToolbarItem(placement: .topBarTrailing) {
              Button {
                eventDispatcher?(["nekofinPlayerNavigation": ["action": "close"]])
              } label: {
                Image(systemName: "xmark")
              }
              .labelStyle(.iconOnly)
              .accessibilityLabel(closeAccessibilityLabel)
            }
          }
      }
      .presentationDetents([.large])
      .presentationDragIndicator(.visible)
      .modifier(NekofinPresentationBackgroundModifier(color: backgroundColor))
      .modifier(NekofinScrollEdgeEffectStyleModifier())
      .tint(colorFromHex(tintColor))
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    } else {
      content
    }
  }
}

struct NekofinEpisodeListRowModifier: ViewModifier {
  func body(content: Content) -> some View {
    content
      .listRowSeparator(.hidden)
      .listRowInsets(EdgeInsets(top: 1, leading: 10, bottom: 1, trailing: 10))
      .listRowBackground(Color.clear)
  }
}

/// SwiftUI modifiers that exist in the iOS SDK but are not wrapped by Expo UI SDK 55.
/// Registering these keeps the upstream UI without raising the app's deployment target.
struct NekofinButtonBorderShapeModifier: ViewModifier {
  func body(content: Content) -> some View {
    content.buttonBorderShape(.capsule)
  }
}

struct NekofinMenuIndicatorModifier: ViewModifier {
  func body(content: Content) -> some View {
    content.menuIndicator(.visible)
  }
}

struct NekofinAccessibilityTraitsModifier: ViewModifier {
  let traits: [String]

  func body(content: Content) -> some View {
    var value: AccessibilityTraits = []
    if traits.contains("isHeader") { _ = value.insert(.isHeader) }
    if traits.contains("isSelected") { _ = value.insert(.isSelected) }
    return content.accessibilityAddTraits(value)
  }
}

struct NekofinAccessibilityCombineModifier: ViewModifier {
  func body(content: Content) -> some View {
    content.accessibilityElement(children: .combine)
  }
}

struct NekofinAccessibilityHiddenModifier: ViewModifier {
  func body(content: Content) -> some View {
    content.accessibilityHidden(true)
  }
}

/// Restore SwiftUI's semantic, Dynamic Type-aware font styles removed from the
/// SDK 55 JavaScript modifier surface. Keep numeric font modifiers available
/// for places that intentionally use fixed point sizes.
struct NekofinFontTextStyleModifier: ViewModifier {
  let textStyle: String
  let weight: String?

  func body(content: Content) -> some View {
    content.font(resolvedFont)
  }

  private var resolvedFont: Font {
    let base: Font
    switch textStyle {
    case "largeTitle": base = .largeTitle
    case "title": base = .title
    case "title3": base = .title3
    case "headline": base = .headline
    case "subheadline": base = .subheadline
    case "footnote": base = .footnote
    default: base = .body
    }
    return resolvedWeight.map(base.weight) ?? base
  }

  private var resolvedWeight: Font.Weight? {
    switch weight {
    case "regular": .regular
    case "medium": .medium
    case "semibold": .semibold
    case "bold": .bold
    default: nil
    }
  }
}

struct NekofinPresentationBackgroundModifier: ViewModifier {
  let color: String

  func body(content: Content) -> some View {
    let fill = colorFromHex(color)
    if #available(iOS 16.4, *) {
      content.presentationBackground(fill)
    } else {
      content.background(fill)
    }
  }
}

struct NekofinScrollEdgeEffectStyleModifier: ViewModifier {
  func body(content: Content) -> some View {
    if #available(iOS 26.0, *) {
      content.scrollEdgeEffectStyle(.soft, for: .top)
    } else {
      content
    }
  }
}

private func colorFromHex(_ value: String) -> Color {
  let hex = value.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
  guard let raw = UInt64(hex, radix: 16) else { return .clear }
  let hasAlpha = hex.count == 8
  let red = Double((raw >> (hasAlpha ? 24 : 16)) & 0xff) / 255
  let green = Double((raw >> (hasAlpha ? 16 : 8)) & 0xff) / 255
  let blue = Double((raw >> (hasAlpha ? 8 : 0)) & 0xff) / 255
  let alpha = hasAlpha ? Double(raw & 0xff) / 255 : 1
  return Color(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
}

/// SDK 55 lacks the upstream SwiftUI scrollPosition JS binding. Attach an
/// explicit ID to each native episode row and use ScrollViewReader to restore
/// the original centered current-episode behavior on supported iOS versions.
struct EpisodeRowIDModifier: ViewModifier {
  let id: String

  func body(content: Content) -> some View {
    content.id(id)
  }
}

struct EpisodeScrollToModifier: ViewModifier {
  let targetID: String

  func body(content: Content) -> some View {
    ScrollViewReader { proxy in
      content
        .onAppear { scroll(proxy) }
        .onChange(of: targetID) { _ in scroll(proxy) }
    }
  }

  private func scroll(_ proxy: ScrollViewProxy) {
    guard !targetID.isEmpty else { return }
    DispatchQueue.main.async {
      proxy.scrollTo(targetID, anchor: .center)
    }
  }
}
